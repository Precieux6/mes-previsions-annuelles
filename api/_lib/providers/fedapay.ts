import axios from 'axios';
import { PAYMENT_CONFIG, fedapayBaseUrl, fedapaySecret } from '../config/payments';

const http = () =>
  axios.create({
    baseURL: fedapayBaseUrl(),
    headers: { Authorization: `Bearer ${fedapaySecret()}` },
    timeout: 15000,
  });

function unwrap(data: any): any {
  return data?.v1?.transaction ?? data?.v1 ?? data?.transaction ?? data;
}

export interface TransactionParams {
  reference: string;
  nomClient: string;
  contact: string;
  phone?: string;
  email?: string;
  paymentPhone?: string;
}

export async function creerTransaction(p: TransactionParams, callbackUrl: string) {
  const parts = p.nomClient.trim().split(/\s+/);
  const prenom = parts[0] || 'Client';
  const nom = parts.slice(1).join(' ') || 'Precieux';

  // Détermination du téléphone pour FedaPay
  const rawPhone = p.paymentPhone || p.phone || (!p.contact.includes('@') ? p.contact : '');
  const cleanPhone = rawPhone ? rawPhone.replace(/[^\d+]/g, '') : undefined;

  // Détermination de l'e-mail
  let emailVal = p.email;
  if (!emailVal && p.contact.includes('@')) {
    const found = p.contact.split('·').find((part) => part.includes('@'));
    if (found) emailVal = found.trim();
  }
  if (!emailVal) {
    emailVal = 'client@mesprevisions.bj';
  }

  const { data } = await http().post('/transactions', {
    description: `${PAYMENT_CONFIG.produit} (${p.reference})`,
    amount: PAYMENT_CONFIG.prix,
    currency: { iso: PAYMENT_CONFIG.devise },
    callback_url: callbackUrl,
    custom_metadata: { reference: p.reference },
    customer: {
      firstname: prenom,
      lastname: nom,
      email: emailVal,
      phone_number: cleanPhone
        ? {
            number: cleanPhone,
            country: PAYMENT_CONFIG.pays,
          }
        : undefined,
    },
  });

  const transaction = unwrap(data);
  const id = String(transaction.id);
  const { data: jeton } = await http().post(`/transactions/${id}/token`, {});
  if (!jeton?.url) {
    throw new Error("FedaPay n'a pas renvoyé d'URL de paiement.");
  }
  return { transactionId: id, paymentUrl: String(jeton.url) };
}

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
