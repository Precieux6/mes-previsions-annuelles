import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './_lib/db';
import { hashToken } from './_lib/tokens';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez GET.' });
  }

  const auth = req.headers.authorization;
  const jeton = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const reference = typeof req.query.ref === 'string' ? req.query.ref : '';

  if (!jeton) {
    return res.status(401).json({ error: 'Jeton d’accès manquant.' });
  }
  if (!/^AST2027-[0-9A-F]{8}$/.test(reference)) {
    return res.status(400).json({ error: 'Référence invalide.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const pool = getPool();
    const o = await pool.query(
      `SELECT id, reference, full_name, birthdate, contact, sign_id, status, created_at
       FROM orders WHERE reference = $1 AND token_hash = $2`,
      [reference, hashToken(jeton)]
    );

    if (o.rows.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable ou jeton invalide.' });
    }

    const order = o.rows[0];

    // Recherche des détails du paiement
    const p = await pool.query(
      `SELECT amount, currency, transaction_id, status, created_at AS paid_at
       FROM payments WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
      [order.id]
    );
    const payment = p.rows[0] || null;

    let documents: Array<{ doc_type: string }> = [];
    if (['paid', 'completed'].includes(order.status)) {
      const d = await pool.query(`SELECT doc_type FROM documents WHERE order_id = $1`, [order.id]);
      documents = d.rows;
    }

    return res.status(200).json({
      order: {
        reference: order.reference,
        full_name: order.full_name,
        birthdate: order.birthdate ? String(order.birthdate).slice(0, 10) : null,
        contact: order.contact,
        sign_id: order.sign_id,
        status: order.status,
        created_at: order.created_at,
        amount: payment ? Number(payment.amount) : 5000,
        currency: payment ? payment.currency : 'XOF',
        transaction_id: payment ? payment.transaction_id : null,
        paid_at: payment ? payment.paid_at : order.created_at,
      },
      documents,
    });
  } catch (err: any) {
    console.error('Erreur API status :', err);
    return res.status(500).json({ error: err?.message || 'Erreur interne lors de la consultation du statut.' });
  }
}
