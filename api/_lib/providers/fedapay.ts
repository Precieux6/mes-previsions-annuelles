import axios from 'axios';
import { PAYMENT_CONFIG, fedapayBaseUrl, fedapaySecret } from '../config/payments';

const http = () =>
  axios.create({
    baseURL: fedapayBaseUrl(),
    headers: { Authorization: `Bearer ${fedapaySecret()}` },
    timeout: 15000,
  });

/** L'API FedaPay encapsule la transaction dans une enveloppe : on la déballe de façon défensive. */
function unwrap(data: any): any {
  return data?.v1?.transaction ?? data?.v1 ?? data?.transaction ?? data;
}

export interface ParamsTransaction {
  reference: string;
  nomClient: string;
  email: string;
  telephone: string;
}

/** Crée la transaction FedaPay et renvoie l'URL de la page de paiement hébergée par FedaPay. */
export async function creerTransaction(p: ParamsTransaction, callbackUrl: string) {
  const [prenom, ...reste] = p.nomClient.trim().split(/\s+/);

  const { data } = await http().post('/transactions', {
    description: `${PAYMENT_CONFIG.produit} (${p.reference})`,
    amount: PAYMENT_CONFIG.prix,
    currency: { iso: PAYMENT_CONFIG.devise },
    callback_url: callbackUrl,
    custom_metadata: { reference: p.reference },
    customer: {
      firstname: prenom,
      lastname: reste.join(' ') || 'Client',
      email: p.email,
      phone_number: { number: p.telephone, country: PAYMENT_CONFIG.pays },
    },
  });

  const transaction = unwrap(data);
  const id = String(transaction.id);

  const { data: jeton } = await http().post(`/transactions/${id}/token`, {});
  if (!jeton?.url) throw new Error("FedaPay n'a pas renvoyé d'URL de paiement.");

  return { transactionId: id, paymentUrl: String(jeton.url) };
}

/** Relit la transaction directement auprès de FedaPay : seule source de vérité du statut. */
export async function verifierTransaction(id: string) {
  const { data } = await http().get(`/transactions/${id}`);
  const t = unwrap(data);
  return {
    id: String(t.id),
    status: String(t.status),
    amount: Number(t.amount),
    currency: String(t.currency?.iso ?? ''),
    reference: t.custom_metadata?.reference as string | undefined,
    raw: data,
  };
}
