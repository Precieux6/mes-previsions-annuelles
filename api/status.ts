import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './_lib/db';
import { hashToken } from './_lib/tokens';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });
  const auth = req.headers.authorization;
  const jeton = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const reference = typeof req.query.ref === 'string' ? req.query.ref : '';
  if (!jeton) return res.status(401).json({ error: 'Jeton d’accès manquant.' });
  if (!/^AST2027-[0-9A-F]{8}$/.test(reference)) return res.status(400).json({ error: 'Référence invalide.' });

  res.setHeader('Cache-Control', 'no-store');
  try {
    const o = await getPool().query(
      `SELECT id, reference, full_name, sign_id, status, created_at FROM orders WHERE reference = $1 AND token_hash = $2`,
      [reference, hashToken(jeton)]);
    if (o.rows.length === 0) return res.status(404).json({ error: 'Commande introuvable ou jeton invalide.' });
    const order = o.rows[0];
    let documents: Array<{ doc_type: string }> = [];
    if (order.status === 'completed') {
      const d = await getPool().query(`SELECT doc_type FROM documents WHERE order_id = $1`, [order.id]);
      documents = d.rows;
    }
    return res.status(200).json({ order: { reference: order.reference, full_name: order.full_name, status: order.status, created_at: order.created_at }, documents });
  } catch (err) {
    console.error('Erreur status :', err);
    return res.status(500).json({ error: 'Erreur interne.' });
  }
}
