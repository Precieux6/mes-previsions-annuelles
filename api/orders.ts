import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getPool } from './_lib/db';
import { validateOrderInput } from './_lib/validation';
import { generateAccessToken } from './_lib/tokens';
import { creerTransaction } from './_lib/providers/fedapay';
import { PAYMENT_CONFIG, publicBaseUrl } from './_lib/config/payments';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const v = validateOrderInput(req.body);
    if (!v.valid) {
      return res.status(400).json({ error: v.error });
    }
    const { fullName, birthdate, contact, signId, phone, email, paymentPhone } = v.data;

    const reference = `AST2027-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const { rawToken, tokenHash } = generateAccessToken();
    const pool = getPool();

    let orderId: number;
    try {
      const o = await pool.query(
        `INSERT INTO orders (reference, token_hash, full_name, birthdate, contact, sign_id, status, annee)
         VALUES ($1, $2, $3, $4, $5, $6, 'created', 2027) RETURNING id`,
        [reference, tokenHash, fullName, birthdate ?? null, contact, signId]
      );
      orderId = o.rows[0].id;
    } catch (err: any) {
      console.error('Création de commande impossible :', err);
      return res.status(500).json({
        error: 'Erreur de connexion à la base de données. Veuillez vérifier la variable DATABASE_URL dans vos paramètres Vercel.',
      });
    }

    let paiement;
    try {
      paiement = await creerTransaction(
        {
          reference,
          nomClient: fullName,
          contact,
          phone,
          email,
          paymentPhone,
        },
        `${publicBaseUrl()}/api/return?ref=${reference}`
      );
    } catch (err: any) {
      console.error('Passerelle FedaPay indisponible :', err);
      await pool.query(`UPDATE orders SET status = 'failed' WHERE id = $1`, [orderId]).catch(() => {});
      return res.status(502).json({
        error:
          err?.response?.data?.message ||
          'La passerelle de paiement FedaPay est temporairement indisponible. Veuillez vérifier vos clés API FedaPay ou réessayer dans un instant.',
      });
    }

    await pool.query(
      `INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status)
       VALUES ($1, 'fedapay', $2, $3, $4, 'pending')`,
      [orderId, paiement.transactionId, PAYMENT_CONFIG.prix, PAYMENT_CONFIG.devise]
    );

    return res.status(200).json({
      reference,
      accessToken: rawToken,
      paymentUrl: paiement.paymentUrl,
    });
  } catch (globalErr: any) {
    console.error('Erreur globale orders handler :', globalErr);
    return res.status(500).json({
      error: globalErr?.message || 'Une erreur inattendue est survenue lors de la création de la commande.',
    });
  }
}
