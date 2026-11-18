// Confirmation d'un paiement : statut, montant, devise et référence relus auprès de FedaPay. Idempotent.
import { getPool } from './db';
import { verifierTransaction } from './providers/fedapay';

export type EtatPaiement = 'paid' | 'pending' | 'failed';

export async function confirmerPaiement(transactionId: string): Promise<EtatPaiement> {
  const distant = await verifierTransaction(transactionId);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `SELECT p.id, p.order_id, p.amount, p.status AS payment_status, o.reference
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.transaction_id = $1 FOR UPDATE OF p, o`, [transactionId]);
    const local = res.rows[0];
    if (!local) throw new Error(`Paiement inconnu : ${transactionId}`);

    const montantOk = Number(local.amount) === distant.amount;
    const devOk = distant.currency === 'XOF';
    const refOk = distant.reference === local.reference;
    if (!montantOk || !devOk || !refOk) {
      await client.query(`UPDATE payments SET status = 'rejected', raw_payload = $2 WHERE id = $1`, [local.id, JSON.stringify(distant.raw)]);
      await client.query('COMMIT');
      return 'failed';
    }
    if (distant.status !== 'approved') {
      await client.query(`UPDATE payments SET status = $2, raw_payload = $3 WHERE id = $1`, [local.id, distant.status, JSON.stringify(distant.raw)]);
      await client.query('COMMIT');
      return distant.status === 'declined' ? 'failed' : 'pending';
    }
    if (local.payment_status === 'approved') {
      await client.query('COMMIT');
      return 'paid';
    }
    await client.query(`UPDATE payments SET status = 'approved', raw_payload = $2 WHERE id = $1`, [local.id, JSON.stringify(distant.raw)]);
    await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'created'`, [local.order_id]);
    await client.query(
      `INSERT INTO jobs (order_id, job_type, status) VALUES ($1, 'generate_order', 'pending')
       ON CONFLICT (order_id, job_type) DO NOTHING`, [local.order_id]);
    await client.query('COMMIT');
    return 'paid';
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
