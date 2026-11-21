// src/lib/spiritualProfile.ts
// Profil spirituel : toutes les données viennent des fichiers de contenu/2027.
// Aucune table en dur : le Mêdji se lit dans geomancie_periodes.json, son texte dans geomancie_medji.json.
import periodesJson from '../../contenu/2027/geomancie_periodes.json';
import medjiJson from '../../contenu/2027/geomancie_medji.json';
import joursJson from '../../contenu/2027/jours_naissance.json';

export interface SigneMedji {
  numero: string;
  nom: string;
  titre: string;
  prophetie: string;
  conseil_2027: string;
  traits: string[];
}

export interface ProfilSpirituel {
  date_naissance: string;
  jour_semaine: string;
  archange: string;
  archange_attribut: string;
  planete_regente: string;
  divinite_protectrice: string | null;
  couleurs_chance: string[];
  animal_porte_bonheur: string;
  mots_cles: string[];
  psaume: string | null;
  interdictions: string[];
  metiers_recommandes: string[];
  vigilances_sante: string;
  signe_medji: SigneMedji;
  chemin_de_vie: number;
}

// ---------- Types des fichiers JSON (seuls les champs utilisés sont décrits) ----------

interface PeriodeMedji {
  signe: string;
  moitie: string;
  debut: string; // MM-JJ
  fin: string;   // MM-JJ
}

interface EntreeMedjiPeriodes {
  numero: string;
  nom: string;
  periodes: PeriodeMedji[];
}

interface FichierPeriodes {
  signes_medji: EntreeMedjiPeriodes[];
}

interface FichierMedji {
  signes_medji: Array<{
    numero: string;
    nom: string;
    titre: string;
    prophetie: string;
    conseil_2027: string;
    traits: string[];
  }>;
}

interface JourNaissance {
  jour: string;
  planete: string;
  archange: string;
  archange_attribut: string;
  divinite_protectrice: string | null;
  couleurs: string[];
  animal_porte_bonheur: string;
  mots_cles: string[];
  psaume: string | null;
  interdictions: string[];
  metiers_recommandes: string[];
  vigilances_sante: string;
}

interface FichierJours {
  jours: Record<string, JourNaissance>;
}

const PERIODES = periodesJson as FichierPeriodes;
const MEDJI = medjiJson as FichierMedji;
const JOURS = (joursJson as FichierJours).jours;

// ---------- Mêdji ----------

/** Vrai si la clé « MM-JJ » tombe dans l'intervalle [debut, fin], bornes incluses.
 *  Si debut est après fin, l'intervalle traverse le 31 décembre (Capricorne). */
function dansIntervalle(cle: string, debut: string, fin: string): boolean {
  return debut <= fin ? cle >= debut && cle <= fin : cle >= debut || cle <= fin;
}

/** Numéro Mêdji (« 01 » à « 16 ») pour une date donnée, d'après geomancie_periodes.json. */
export function getNumeroMedji(month: number, day: number): string {
  const cle = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  for (const entree of PERIODES.signes_medji) {
    if (entree.periodes.some((p) => dansIntervalle(cle, p.debut, p.fin))) {
      return entree.numero;
    }
  }
  // Ne doit pas arriver : spirit:check vérifie que chaque jour de l'année est couvert.
  throw new Error(`Aucun signe Mêdji pour le ${cle}.`);
}

export function getMedjiSign(month: number, day: number): SigneMedji {
  const numero = getNumeroMedji(month, day);
  const texte = MEDJI.signes_medji.find((s) => s.numero === numero);
  if (!texte) {
    throw new Error(`Texte absent dans geomancie_medji.json pour le Mêdji ${numero}.`);
  }
  return {
    numero: texte.numero,
    nom: texte.nom,
    titre: texte.titre,
    prophetie: texte.prophetie,
    conseil_2027: texte.conseil_2027,
    traits: texte.traits,
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

  const jour = JOURS[CLES_JOURS[d.getUTCDay()]];
  if (!jour) throw new Error(`Données du jour absentes dans jours_naissance.json : ${CLES_JOURS[d.getUTCDay()]}`);

  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  return {
    date_naissance: dateIso,
    jour_semaine: jour.jour,
    archange: jour.archange,
    archange_attribut: jour.archange_attribut,
    planete_regente: jour.planete,
    divinite_protectrice: jour.divinite_protectrice,
    couleurs_chance: jour.couleurs,
    animal_porte_bonheur: jour.animal_porte_bonheur,
    mots_cles: jour.mots_cles,
    psaume: jour.psaume,
    interdictions: jour.interdictions,
    metiers_recommandes: jour.metiers_recommandes,
    vigilances_sante: jour.vigilances_sante,
    signe_medji: getMedjiSign(month, day),
    chemin_de_vie: getCheminDeVie(dateIso),
  };
}
