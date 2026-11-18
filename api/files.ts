// Téléchargement d'un document : accès uniquement avec le jeton de la commande, puis URL R2 signée de 5 minutes.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './_lib/db';
import { hashToken } from './_lib/tokens';
import { urlTelechargement } from '../packages/storage/r2';

const TYPES = /^(pdf_36_pages|receipt_pdf|audio_(0[1-9]|1[0-2]|annuel|tendances))$/;
const NOMS: Record<string, (ref: string) => string> = {
  pdf_36_pages: (r) => `Mes-previsions-annuelles-2027-${r}.pdf`,
  receipt_pdf: (r) => `Recu-${r}.pdf`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Méthode non autorisée' }); }
  const auth = req.headers.authorization;
  const jeton = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const reference = typeof req.query.ref === 'string' ? req.query.ref : '';
  const type = typeof req.query.type === 'string' ? req.query.type : '';
  if (!jeton || !/^AST2027-[0-9A-F]{8}$/.test(reference) || !TYPES.test(type)) return res.status(400).json({ error: 'Paramètres invalides.' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    const r = await getPool().query(
      `SELECT o.status, d.storage_key, d.expires_at FROM orders o
       LEFT JOIN documents d ON d.order_id = o.id AND d.doc_type = $3
       WHERE o.reference = $1 AND o.token_hash = $2`, [reference, hashToken(jeton), type]);
    const ligne = r.rows[0];
    if (!ligne) return res.status(404).json({ error: 'Document introuvable.' });
    if (ligne.status !== 'completed') return res.status(409).json({ error: 'Les documents ne sont pas encore prêts.' });
    if (!ligne.storage_key) return res.status(404).json({ error: 'Document introuvable.' });
    if (ligne.expires_at && new Date(ligne.expires_at) < new Date()) return res.status(410).json({ error: 'Ce document a expiré.' });
    const nom = (NOMS[type] ?? ((x: string) => `${type}-${x}.wav`))(reference);
    return res.redirect(302, await urlTelechargement(ligne.storage_key, nom, 300));
  } catch (err) {
    console.error('Accès au document impossible :', err);
    return res.status(500).json({ error: 'Erreur interne.' });
  }
}
