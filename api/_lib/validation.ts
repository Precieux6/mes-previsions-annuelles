// Validation des entrées. La date de naissance est facultative : sans elle, la commande passe en mode « nom ».
export const SIGNES = ['belier', 'taureau', 'gemeaux', 'cancer', 'lion', 'vierge',
  'balance', 'scorpion', 'sagittaire', 'capricorne', 'verseau', 'poissons'] as const;
export const SANS_SIGNE = 'nom_seul';

export interface OrderInput { fullName: string; birthdate?: string; contact: string; signId: string }
type Resultat = { valid: true; data: OrderInput } | { valid: false; error: string };

function dateValide(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

export function validateOrderInput(body: unknown): Resultat {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Requête invalide.' };
  const b = body as Record<string, unknown>;

  const fullName = typeof b.fullName === 'string' ? b.fullName.trim().replace(/\s+/g, ' ') : '';
  if (fullName.length < 2 || fullName.length > 120) return { valid: false, error: 'Nom complet requis (2 à 120 caractères).' };
  if (!/^[\p{L}' .-]+$/u.test(fullName)) return { valid: false, error: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets.' };

  const contact = typeof b.contact === 'string' ? b.contact.trim() : '';
  const estEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const estTelephone = /^\+?[\d\s]{8,20}$/.test(contact);
  if (!estEmail && !estTelephone) return { valid: false, error: 'Adresse e-mail ou numéro de téléphone valide requis.' };

  let birthdate: string | undefined;
  if (b.birthdate !== undefined && b.birthdate !== null && b.birthdate !== '') {
    if (typeof b.birthdate !== 'string' || !dateValide(b.birthdate)) return { valid: false, error: 'Date de naissance invalide.' };
    const annee = Number(b.birthdate.slice(0, 4));
    const aujourdhui = new Date().toISOString().slice(0, 10);
    if (annee < 1900 || b.birthdate > aujourdhui) return { valid: false, error: 'Date de naissance hors plage (après 1900, pas dans le futur).' };
    birthdate = b.birthdate;
  }

  let signId = SANS_SIGNE;
  if (birthdate) {
    const s = typeof b.signId === 'string' ? b.signId : '';
    if (!(SIGNES as readonly string[]).includes(s)) return { valid: false, error: 'Signe astrologique invalide.' };
    signId = s;
  }
  return { valid: true, data: { fullName, birthdate, contact, signId } };
}
