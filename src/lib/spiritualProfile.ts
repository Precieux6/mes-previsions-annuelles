// src/lib/spiritualProfile.ts
// Profil spirituel : toutes les données viennent de contenu/2027. Aucune table en dur.
import periodesJson from '../../contenu/2027/geomancie_periodes.json';
import medjiJson from '../../contenu/2027/geomancie_medji.json';
import joursJson from '../../contenu/2027/jours_naissance.json';

// ---------- Types calqués sur la structure réelle des fichiers ----------

interface Sourcee { valeur: string; source: string }

interface FichierPeriodes {
  signes_medji: Array<{
    numero: string;
    nom: string;
    periodes: Array<{ signe: string; moitie: string; debut: string; fin: string }>;
  }>;
}

interface EntreeMedji {
  // Clé lue dans geomancie_medji.json. Voir la note de vérification ci-dessous.
  numéro: string;
  nom: string;
  titre: string;
  signes_zodiacaux: Array<{ signe: string; moitie: string }>;
  faits: Record<string, string[]>;
  conseil_2027: string;
  origine_conseil: string;
}

interface FichierMedji {
  signes_medji: EntreeMedji[];
}

interface Archange {
  nom: string;
  source: string;
  attribut: string;
  attribut_source: string;
}

interface JourNaissance {
  jour: string;
  ordre: number;
  planete: Sourcee;
  archange: Archange;
  divinite_protectrice: Sourcee;
  influences_planetaires: unknown;
  // Les autres champs ne sont pas typés ici : ils sont lus avec chaine() et listeChaines().
  [cle: string]: unknown;
}

interface FichierJours {
  jours: Record<string, JourNaissance>;
}

// ---------- Types exportés ----------

export interface SigneMedji {
  numero: string;
  nom: string;
  titre: string;
  prophetie: string;      // dérivé des faits « caractère et qualités » (le champ prophétie n'existe plus)
  conseil_2027: string;
  signes_zodiacaux: Array<{ signe: string; moitie: string }>;
  faits: Record<string, string[]>;
}

export interface ProfilSpirituel {
  date_naissance: string;
  jour_semaine: string;
  archange: string;
  archange_attribut: string;
  planete_regente: string;
  divinite_protectrice: string | null;
  couleurs_chance: string[];
  animal_porte_bonheur: string | null;
  mots_cles: string[];
  psaume: string | null;
  interdictions: string[];
  metiers_recommandes: string[];
  vigilances_sante: string | null;
  signe_medji: SigneMedji;
  chemin_de_vie: number;
}

const PERIODES = periodesJson as FichierPeriodes;
const MEDJI = medjiJson as FichierMedji;
const JOURS = (joursJson as FichierJours).jours;

// ---------- Lecture tolérante des champs ----------

/** Texte d'un champ : chaîne directe, ou objet { valeur }. */
function chaine(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && typeof (v as Sourcee).valeur === 'string') return (v as Sourcee).valeur;
  return null;
}

/** Liste de chaînes ; renvoie [] si le champ est absent ou n'est pas une liste. */
function listeChaines(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

// ---------- Mêdji ----------

/** Vrai si « MM-JJ » tombe dans [debut, fin], bornes incluses. Si debut > fin, l'intervalle traverse le 31 décembre. */
function dansIntervalle(cle: string, debut: string, fin: string): boolean {
  return debut <= fin ? cle >= debut && cle <= fin : cle >= debut || cle <= fin;
}

/** Numéro Mêdji (« 01 » à « 16 ») pour une date, d'après geomancie_periodes.json. */
export function getNumeroMedji(month: number, day: number): string {
  const cle = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  for (const entree of PERIODES.signes_medji) {
    if (entree.periodes.some((p) => dansIntervalle(cle, p.debut, p.fin))) {
      return entree.numero;
    }
  }
  throw new Error(`Aucun signe Mêdji pour le ${cle} (voir geomancie_periodes.json).`);
}

export function getMedjiSign(month: number, day: number): SigneMedji {
  const numero = getNumeroMedji(month, day);
  const e = MEDJI.signes_medji.find((s) => s.numéro === numero);
  if (!e) throw new Error(`Texte absent dans geomancie_medji.json pour le Mêdji ${numero}.`);
  return {
    numero: e.numéro,
    nom: e.nom,
    titre: e.titre,
    prophetie: (e.faits.caractere_et_qualites ?? []).join(' '),
    conseil_2027: e.conseil_2027,
    signes_zodiacaux: e.signes_zodiacaux,
    faits: e.faits,
  };
}

// ---------- Nombres ----------

export function reduireChiffres(n: number, garderMaitres: boolean = true): number {
  const maitres = [11, 22, 33];
  while (n > 9 && !(garderMaitres && maitres.includes(n))) {
    n = String(n)
      .split('')
      .reduce((acc, c) => acc + parseInt(c, 10), 0);
  }
  return n;
}

/** Chemin de vie : somme de tous les chiffres de la date, nombres maîtres conservés. */
export function getCheminDeVie(dateIso: string): number {
  const digits = dateIso.replace(/\D/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduireChiffres(sum, true);
}

// ---------- Profil ----------

const CLES_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function analyserProfilClient(dateIso: string): ProfilSpirituel | null {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null;

  const d = new Date(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;

  const cle = CLES_JOURS[d.getUTCDay()];
  const jour = JOURS[cle];
  if (!jour) throw new Error(`Données du jour absentes dans jours_naissance.json : ${cle}`);

  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  return {
    date_naissance: dateIso,
    jour_semaine: jour.jour,
    archange: jour.archange.nom,
    archange_attribut: jour.archange.attribut,
    planete_regente: jour.planete.valeur,
    divinite_protectrice: chaine(jour.divinite_protectrice),
    couleurs_chance: listeChaines(jour.couleurs),
    animal_porte_bonheur: chaine(jour.animal_porte_bonheur),
    mots_cles: listeChaines(jour.mots_cles),
    psaume: chaine(jour.psaume),
    interdictions: listeChaines(jour.interdictions),
    metiers_recommandes: listeChaines(jour.metiers_recommandes),
    vigilances_sante: chaine(jour.vigilances_sante),
    signe_medji: getMedjiSign(month, day),
    chemin_de_vie: getCheminDeVie(dateIso),
  };
}
