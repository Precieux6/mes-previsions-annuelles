import axios from 'axios';
import { PAYMENT_CONFIG, fedapaySecret, fedapayBaseUrl } from '../config/payments.js';

const http = () =>
  axios.create({
    baseURL: fedapayBaseUrl(),
    headers: {
      Authorization: `Bearer ${fedapaySecret()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 15000,
  });

function unwrap(data: any): any {
  if (!data || typeof data !== 'object') return {};
  return (
    data['v1/transaction'] ??
    data.v1_transaction ??
    data.v1?.transaction ??
    data.v1 ??
    data.transaction ??
    data.data ??
    data
  );
}

function extractPaymentUrl(jetonData: any): string | undefined {
  if (!jetonData || typeof jetonData !== 'object') return undefined;
  const nested =
    jetonData['v1/token'] ??
    jetonData.v1_token ??
    jetonData.token_data ??
    jetonData.data ??
    jetonData;
  return (
    nested?.url ??
    nested?.payment_url ??
    jetonData?.url ??
    jetonData?.payment_url
  );
}

function normalizePhoneNumber(rawPhone?: string): string | undefined {
  if (!rawPhone) return undefined;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return undefined;
  // Si un indicatif 229 est présent avec un numéro béninois à 10 chiffres (ex: 22901XXXXXXXX), on garde le numéro local ou format propre
  if (digits.startsWith('229') && digits.length > 10) {
    digits = digits.slice(3);
  }
  return digits;
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
  const rawPhone =
    p.paymentPhone || p.phone || (!p.contact.includes('@') ? p.contact : '');
  const cleanPhone = normalizePhoneNumber(rawPhone);

  // Détermination de l'e-mail
  let emailVal = p.email?.trim();
  if (!emailVal && p.contact.includes('@')) {
    const found = p.contact
      .split(/[·,|;]/)
      .map((part) => part.trim())
      .find((part) => part.includes('@'));
    if (found) emailVal = found;
  }
  if (!emailVal) {
    emailVal = 'client@mesprevisions.bj';
  }

  const payload: Record<string, any> = {
    description: `${PAYMENT_CONFIG.produit} (${p.reference})`,
    amount: Math.round(Number(PAYMENT_CONFIG.prix)),
    currency: { iso: PAYMENT_CONFIG.devise },
    callback_url: callbackUrl,
    custom_metadata: { reference: p.reference },
    customer: {
      firstname: prenom,
      lastname: nom,
      email: emailVal,
    },
  };

  if (cleanPhone) {
    payload.customer.phone_number = {
      number: cleanPhone,
      country: String(PAYMENT_CONFIG.pays || 'bj').toLowerCase(),
    };
  }

  const { data } = await http().post('/transactions', payload);
  const transaction = unwrap(data);
  const rawId = transaction?.id;

  if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
    throw new Error(
      `ID de transaction FedaPay manquant dans la réponse : ${JSON.stringify(data)}`
    );
  }

  const id = String(rawId);
  const { data: jeton } = await http().post(`/transactions/${id}/token`, {});
  const paymentUrl = extractPaymentUrl(jeton);

  if (!paymentUrl) {
    throw new Error(
      `FedaPay n'a pas renvoyé d'URL de paiement : ${JSON.stringify(jeton)}`
    );
  }

  return {
    transactionId: id,
    paymentUrl: String(paymentUrl),
  };
}

export async function verifierTransaction(id: string) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error(`Identifiant de transaction invalide : ${id}`);
  }

  const { data } = await http().get(`/transactions/${id}`);
  const t = unwrap(data);

  if (!t?.id) {
    throw new Error(
      `Transaction FedaPay introuvable dans la réponse : ${JSON.stringify(data)}`
    );
  }

  return {
    id: String(t.id),
    status: String(t.status ?? ''),
    amount: Number(t.amount),
    currency: String(t.currency?.iso ?? ''),
    reference: t.custom_metadata?.reference as string | undefined,
    raw: data,
  };
}
