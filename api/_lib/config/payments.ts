// Configuration du paiement. Le prix et la devise sont fixés côté serveur : le client ne peut pas les modifier.
export const PAYMENT_CONFIG = { devise: 'XOF', prix: 5000, pays: 'bj', produit: 'Mes prévisions annuelles 2027' } as const;

export function fedapaySecret(): string {
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key) throw new Error('FEDAPAY_SECRET_KEY non configurée.');
  return key;
}

export function fedapayBaseUrl(): string {
  if (process.env.FEDAPAY_API_URL) return process.env.FEDAPAY_API_URL;
  return process.env.FEDAPAY_ENV === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';
}

export function publicBaseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) throw new Error('PUBLIC_BASE_URL non configurée.');
  return url.replace(/\/$/, '');
}
