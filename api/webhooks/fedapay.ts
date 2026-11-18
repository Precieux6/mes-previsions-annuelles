// Webhook FedaPay : seul l'identifiant de transaction est utilisé ; le statut est relu auprès de FedaPay.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../_lib/db';
import { confirmerPaiement } from '../_lib/paiement';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const corps = (req.body ?? {}) as Record<string, any>;
  const entite = corps.entity ?? corps.data?.entity;
  const transactionId = entite?.id !== undefined ? String(entite.id) : null;
  if (!transactionId) return res.status(400).json({ error: 'Événement sans transaction.' });
  try {
    const etat = await confirmerPaiement(transactionId);
    const eventId = corps.id !== undefined ? String(corps.id) : `${corps.name ?? 'event'}:${transactionId}`;
    await getPool().query(
      `INSERT INTO webhook_events (provider, event_id, payload) VALUES ('fedapay', $1, $2) ON CONFLICT (event_id) DO NOTHING`,
      [eventId, JSON.stringify(corps)]);
    return res.status(200).json({ received: true, etat });
  } catch (err) {
    console.error('Webhook FedaPay en échec :', err);
    return res.status(500).json({ error: 'Traitement impossible, nouvelle tentative attendue.' });
  }
}
