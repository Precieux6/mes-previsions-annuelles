// Validation robuste des entrées de commande.
export const SIGNES = ['belier', 'taureau', 'gemeaux', 'cancer', 'lion', 'vierge',
  'balance', 'scorpion', 'sagittaire', 'capricorne', 'verseau', 'poissons'] as const;
export const SANS_SIGNE = 'nom_seul';

export interface OrderInput {
  fullName: string;
  birthdate?: string;
  contact: string;
  signId: string;
  phone?: string;
  telephone?: string;
  email: string;
  paymentPhone?: string;
}

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
  if (fullName.length < 2 || fullName.length > 120) {
    return { valid: false, error: 'Nom complet requis (2 à 120 caractères).' };
  }
  if (!/^[\p{L}' .-]+$/u.test(fullName)) {
    return { valid: false, error: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets.' };
  }

  // Support de phone ou telephone
  const rawPhone = typeof b.phone === 'string' ? b.phone.trim() : typeof b.telephone === 'string' ? b.telephone.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const paymentPhone = typeof b.paymentPhone === 'string' ? b.paymentPhone.trim() : '';
  const rawContact = typeof b.contact === 'string' ? b.contact.trim() : '';

  let contactFinal = '';
  if (rawPhone || email) {
    const parts = [rawPhone, email].filter(Boolean);
    contactFinal = parts.join(' · ').slice(0, 120);
  } else if (rawContact) {
    contactFinal = rawContact.slice(0, 120);
  } else {
    return { valid: false, error: 'Un numéro de téléphone ou une adresse e-mail est requis.' };
  }

  // Date de naissance facultative
  let birthdate: string | undefined;
  if (b.birthdate !== undefined && b.birthdate !== null && b.birthdate !== '') {
    if (typeof b.birthdate !== 'string' || !dateValide(b.birthdate)) {
      return { valid: false, error: 'Date de naissance invalide.' };
    }
    const annee = Number(b.birthdate.slice(0, 4));
    const aujourdhui = new Date().toISOString().slice(0, 10);
    if (annee < 1900 || b.birthdate > aujourdhui) {
      return { valid: false, error: 'Date de naissance hors plage (après 1900, pas dans le futur).' };
    }
    birthdate = b.birthdate;
  }

  // Signe astrologique
  let signId = SANS_SIGNE;
  if (birthdate) {
    const s = typeof b.signId === 'string' ? b.signId : '';
    if ((SIGNES as readonly string[]).includes(s)) {
      signId = s;
    } else {
      signId = 'cancer'; // Fallback par défaut
    }
  }

  return {
    valid: true,
    data: {
      fullName,
      birthdate,
      contact: contactFinal,
      signId,
      phone: rawPhone || (contactFinal.includes('@') ? '' : contactFinal),
      telephone: rawPhone || (contactFinal.includes('@') ? '' : contactFinal),
      email: email || (contactFinal.includes('@') ? contactFinal : ''),
      paymentPhone: paymentPhone || rawPhone,
    },
  };
}
