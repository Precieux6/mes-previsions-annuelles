// Retour du navigateur après paiement : confirmation auprès de FedaPay, puis redirection vers le suivi.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './_lib/db';
import { confirmerPaiement } from './_lib/paiement';
import { publicBaseUrl } from './_lib/config/payments';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const reference = typeof req.query.ref === 'string' ? req.query.ref : '';
  if (!/^AST2027-[0-9A-F]{8}$/.test(reference)) return res.status(400).send('Référence invalide.');
  try {
    const r = await getPool().query(
      `SELECT p.transaction_id FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE o.reference = $1 ORDER BY p.id DESC LIMIT 1`, [reference]);
    if (r.rows[0]) await confirmerPaiement(r.rows[0].transaction_id);
  } catch (err) {
    console.error('Confirmation au retour impossible (le webhook reprendra) :', err);
  }
  res.setHeader('Location', `${publicBaseUrl()}/suivi?ref=${reference}`);
  return res.status(302).end();
}
