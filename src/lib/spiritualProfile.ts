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
  divinite_protectrice: string;
  couleurs_chance: string[];
  animal_porte_bonheur: string;
  mots_cles: string[];
  psaume: string;
  interdictions: string[];
  metiers_recommandes: string[];
  vigilances_sante: string;
  signe_medji: SigneMedji;
  chemin_de_vie: number;
}

const JOURS_DATA: Record<string, any> = {
  lundi: {
    jour: 'Lundi',
    planete: 'La Lune',
    archange: 'Gabriel',
    archange_attribut: 'Force de Dieu',
    divinite_protectrice: 'Sakpatè (Sakpata)',
    couleurs: ['Blanc', 'Pourpre'],
    animal: 'Le chat',
    mots_cles: ['Imagination', 'Audace', 'Connaissance'],
    psaume: 'Psaume 103',
    interdictions: ['Ne jamais verser le sang (avortement prohibé)', 'Pas d’eaux sales stagnantes'],
    metiers: ['Psychologie', 'Investigation', 'Mode & Création', 'Enfance'],
    sante: 'Hypersensibilité et vitalité liée aux phases lunaires',
  },
  mardi: {
    jour: 'Mardi',
    planete: 'Mars',
    archange: 'Samaël (Camaël)',
    archange_attribut: 'Prince Supérieur',
    divinite_protectrice: 'Gou (Feu et Fer)',
    couleurs: ['Rouge', 'Blanc', 'Jaune'],
    animal: 'L’Aigle',
    mots_cles: ['Combattre', 'Lutter', 'Donner', 'Aimer'],
    psaume: 'Psaume 110',
    interdictions: ['Vêtements rouges', 'Huile rouge', 'Colères répétitives'],
    metiers: ['Chirurgie', 'Armée', 'Automobile', 'Commerce'],
    sante: 'Tension artérielle et système cardio-vasculaire',
  },
  mercredi: {
    jour: 'Mercredi',
    planete: 'Mercure',
    archange: 'Michaël (Mikaël)',
    archange_attribut: 'Qui est comme Dieu',
    divinite_protectrice: 'Messagers du Vent',
    couleurs: ['Gris', 'Cendre'],
    animal: 'La panthère',
    mots_cles: ['Voyager', 'Bouger', 'Parler', 'Communiquer'],
    psaume: 'Psaumes de prospérité',
    interdictions: ['Pintade', 'Maïs grillé', 'Pop-corn', 'Pastèque', 'Vêtements noirs'],
    metiers: ['Communication', 'Médias', 'Informatique', 'Négociation'],
    sante: 'Système nerveux et équilibre intime',
  },
  jeudi: {
    jour: 'Jeudi',
    planete: 'Jupiter',
    archange: 'Tzadkiel',
    archange_attribut: 'Miséricorde divine',
    divinite_protectrice: 'Hèviesso (Force royale du tonnerre)',
    couleurs: ['Bleu Nuit', 'Orange'],
    animal: 'Le cheval',
    mots_cles: ['Optimisme', 'Générosité', 'Confiance', 'Autorité'],
    psaume: 'Psaume de protection royale',
    interdictions: ['Poisson après 18h', 'Plage/nage nocturne en mer', 'Habits noirs/rouges'],
    metiers: ['Droit & Justice', 'Commerce d’envergure', 'Enseignement'],
    sante: 'Foie et gestion du surmenage',
  },
  vendredi: {
    jour: 'Vendredi',
    planete: 'Vénus',
    archange: 'Haniel',
    archange_attribut: 'Beauté et Grâce de Dieu',
    divinite_protectrice: 'Nan / Mami (Mère des Eaux)',
    couleurs: ['Rose', 'Vert émeraude'],
    animal: 'Le cheval',
    mots_cles: ['Amour', 'Désir', 'Beauté', 'Harmonie'],
    psaume: 'Le Cantique des Cantiques',
    interdictions: ['Gombo & Papaye (tueurs de chance)', 'Viande de porc', 'Huile rouge'],
    metiers: ['Mode & Haute Couture', 'Design & Décoration', 'Arts'],
    sante: 'Équilibre lymphatique et bien-être intérieur',
  },
  samedi: {
    jour: 'Samedi',
    planete: 'Saturne',
    archange: 'Tzaphkiel',
    archange_attribut: 'Celui qui contemple les Mystères',
    divinite_protectrice: 'Les Anciens de la Terre',
    couleurs: ['Beige', 'Blanc', 'Violet'],
    animal: 'Le chien',
    mots_cles: ['Compétence', 'Fidélité', 'Recherche', 'Sagesse'],
    psaume: 'Cherchez d’abord le royaume des cieux',
    interdictions: ['Magie noire', 'Trahison des maîtres', 'Porc & Huile rouge'],
    metiers: ['Sacerdoce & Spiritualité', 'Recherche', 'Médecine', 'Agriculture'],
    sante: 'Articulations et résistance osseuse',
  },
  dimanche: {
    jour: 'Dimanche',
    planete: 'Le Soleil',
    archange: 'Raphaël',
    archange_attribut: 'Guérisseur de Dieu',
    divinite_protectrice: 'Mahou / Lumière Primordiale',
    couleurs: ['Jaune éclatant', 'Or', 'Orange'],
    animal: 'Le lion',
    mots_cles: ['Briller', 'Rayonner', 'Leadership', 'Royauté'],
    psaume: 'Psaume 19',
    interdictions: ['Viande de porc', 'Huile rouge', 'Ingratitude envers les bienfaiteurs'],
    metiers: ['Dirigeant d’entreprise', 'Haute finance', 'Action politique', 'Tourisme'],
    sante: 'Cœur, colonne vertébrale et vision',
  },
};

const MEDJI_DATABASE: Record<string, SigneMedji> = {
  '01': {
    numero: '01',
    nom: 'Gbè - Medji',
    titre: 'Le Guerrier Triomphant et la Victoire après l’Épreuve',
    prophetie: 'Audace particulière, grande autorité, beau guerrier connaissant la gloire et la réussite dans ses entreprises. Juste et fort. Alliances de grand renom.',
    conseil_2027: 'Votre résilience est votre couronne. 2027 vous élève au rang de bâtisseur d’honneur soutenu par des alliances féminines de prestige.',
    traits: ['Audace', 'Autorité naturelle', 'Succès durable', 'Honnêteté'],
  },
  '02': {
    numero: '02',
    nom: 'Yèkou - Medji',
    titre: 'Le Chef Respecté et le Grand Voyageur',
    prophetie: 'Fidèle à la parole donnée, chef populaire qui aura gloire et honneur. Grand voyageur s’épanouissant au loin.',
    conseil_2027: 'Cultivez la maîtrise du silence. Votre renommée franchira les frontières en préservant votre énergie vitale.',
    traits: ['Parole d’honneur', 'Popularité', 'Voyages', 'Leadership'],
  },
  '03': {
    numero: '03',
    nom: 'Winlin - Medji',
    titre: 'L’Étoile Montante et l’Éclat après l’Austerité',
    prophetie: 'Enfance rude mais vie adulte éclatante. Emploi brillant au-dessus des clivages, autorité incontestable et place de choix.',
    conseil_2027: 'Vos épreuves d’hier deviennent vos atouts majeurs. 2027 consacre votre valeur au plus haut niveau.',
    traits: ['Estime universelle', 'Ascension éclatante', 'Haute position'],
  },
  '04': {
    numero: '04',
    nom: 'Di - Medji',
    titre: 'Le Sage Réservé et la Réussite Silencieuse',
    prophetie: 'Recherche la réussite dans la discrétion. Grande conscience professionnelle et dévouement absolu. Vie dure au départ mais brillante et influente.',
    conseil_2027: 'Sortez de la réserve. Votre constance exemplaire est récompensée par une assise matérielle incontournable cette année.',
    traits: ['Discrétion', 'Dévouement', 'Patience', 'Solidité'],
  },
  '05': {
    numero: '05',
    nom: 'Losso - Medji',
    titre: 'Le Justicier Passionné et l’Œil de Clairvoyance',
    prophetie: 'Passionné, sens aigu de la justice et intuition hors norme. Réussite équitable, attention aux dépenses inconsidérées.',
    conseil_2027: 'Fiez-vous à votre sixième sens infaillible. Évitez les querelles d’intérêt pour préserver votre tranquillité financière.',
    traits: ['Intuition développée', 'Sens de la justice', 'Passion'],
  },
  '06': {
    numero: '06',
    nom: 'Winlin - Medji (Lion)',
    titre: 'Le Bâtisseur Vénéré et la Gloire par le Travail',
    prophetie: 'Franc, modeste et charitable. S’élève au-dessus de son milieu d’origine par son savoir-faire et son dévouement.',
    conseil_2027: 'Votre travail acharné force l’admiration. 2027 est l’année où vous récoltez les fruits légitimes de votre constance.',
    traits: ['Franchise', 'Charité', 'Élévation sociale', 'Travail'],
  },
  '07': {
    numero: '07',
    nom: 'Ablà - Medji',
    titre: 'L’Équilibre Souverain et le Triomphe de la Rigueur',
    prophetie: 'Longue santé, rigueur et bonnes habitudes. Réussite solide et bonheur triomphant dans tous les domaines d’activité.',
    conseil_2027: 'Scellez vos accords avec méthode. Votre rigueur vous mène à une stabilité durable et reconnue.',
    traits: ['Rigueur', 'Longue santé', 'Bonnes alliances', 'Triomphe'],
  },
  '08': {
    numero: '08',
    nom: 'Aklan - Medji',
    titre: 'L’Homme d’Honneur et le Sage Solitaire',
    prophetie: 'Homme d’honneur réfléchi et sûr de lui. Fort, aimé de tous, traversant les hauts et les bas vers un bonheur durable.',
    conseil_2027: 'Chassez les doutes solitaires. 2027 vous ouvre un horizon lumineux et stable après des années de réflexion.',
    traits: ['Honneur', 'Profondeur', 'Résistance', 'Pondération'],
  },
  '09': {
    numero: '09',
    nom: 'Guda - Medji',
    titre: 'Le Juge Ferme et la Puissance Vigorante',
    prophetie: 'Juge ferme agissant avec vigueur. S’étend malgré les obstacles, caractère honnête et déterminé surmontant les tourments.',
    conseil_2027: 'Associez fermeté et diplomatie. Préservez votre santé physique par des temps de repos réguliers.',
    traits: ['Fermeté', 'Volonté de fer', 'Justice', 'Détermination'],
  },
  '10': {
    numero: '10',
    nom: 'Sa - Medji',
    titre: 'Le Mage Inspiré et le Secours Providentiel',
    prophetie: 'Grand voyageur attiré par les sciences mystiques. Réussite après de durs débuts, secours providentiel toujours présent.',
    conseil_2027: 'Gardez une confiance totale. Une intervention providentielle inattendue débloquera les situations clés cette année.',
    traits: ['Protection divine', 'Mysticisme', 'Voyages', 'Générosité'],
  },
  '11': {
    numero: '11',
    nom: 'Tula - Medji',
    titre: 'Le Charme Magnétique et le Stratège Redoutable',
    prophetie: 'Charme irrésistible, intelligence tactique supérieure, richesse et nombreuse famille, ruse persévérante face aux épreuves.',
    conseil_2027: 'Mettez votre génie stratégique au service de la paix. La clémence consolidera votre prospérité.',
    traits: ['Magnétisme', 'Stratégie', 'Opulence', 'Persévérance'],
  },
  '12': {
    numero: '12',
    nom: 'Turukpen - Medji',
    titre: 'Le Juste Équitable et le Chef de Collectivité',
    prophetie: 'Excellent juge à l’équité remarquable. Chef d’une grande collectivité, voyages fréquents et fin de vie hautement bénie.',
    conseil_2027: 'Surmontez les scrupules et hésitations. Votre entourage attend votre voix claire pour diriger.',
    traits: ['Équité', 'Leadership communautaire', 'Santé', 'Sagesse'],
  },
  '13': {
    numero: '13',
    nom: 'Lete - Medji',
    titre: 'L’Architecte des Grands Travaux et l’Homme d’Influence',
    prophetie: 'Persévérant, travailleur d’élite et administrateur influent menant de grands chantiers durables.',
    conseil_2027: '2027 est votre rampe de lancement pour vos projets majeurs. Gardez le secret jusqu’au succès.',
    traits: ['Influence', 'Bâtisseur', 'Persévérance', 'Autorité'],
  },
  '14': {
    numero: '14',
    nom: 'Sete - Medji',
    titre: 'Le Flambeau Intrépide et le Guide Familial',
    prophetie: 'Consulté par tous, n’a peur de rien, animé d’une grande passion générant des succès retentissants et la renommée.',
    conseil_2027: 'Votre bravoure naturelle est un phare. Tempérez vos impulsions amoureuses pour goûter à la sérénité.',
    traits: ['Courage', 'Guide respecté', 'Renommée', 'Passion'],
  },
  '15': {
    numero: '15',
    nom: 'Ka - Medji',
    titre: 'Le Mystique Résilient et la Paix Après l’Épreuve',
    prophetie: 'Esprit libre et patient face aux batailles. Bonheur et richesse obtenus avec le temps, conscience tranquille et mystique.',
    conseil_2027: 'Fiez-vous à votre boussole morale. Vos intuitions spirituelles vous garantissent l’abondance.',
    traits: ['Profondeur mystique', 'Résilience', 'Sérénité', 'Sensibilité'],
  },
  '16': {
    numero: '16',
    nom: 'Fu - Medji',
    titre: 'Le Commandeur Dévoué et le Gardien de l’Ordre',
    prophetie: 'Forte autorité morale se sacrifiant pour les siens. Loyal, franc et attaché à la discipline, à l’ordre et à la hiérarchie.',
    conseil_2027: 'Votre droiture est sacrée. En 2027, ouvrez votre cœur à la bienveillance pour adoucir votre autorité.',
    traits: ['Loyauté', 'Discipline', 'Protection familiale', 'Ordre'],
  },
};

export function reduireChiffres(n: number, garderMaitres: boolean = true): number {
  const maitres = [11, 22, 33];
  while (n > 9 && !(garderMaitres && maitres.includes(n))) {
    n = String(n)
      .split('')
      .reduce((acc, c) => acc + parseInt(c, 10), 0);
  }
  return n;
}

export function getCheminDeVie(dateIso: string): number {
  const digits = dateIso.replace(/\D/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduireChiffres(sum, true);
}

export function getMedjiSign(month: number, day: number): SigneMedji {
  // Bélier (21 mars - 19 avril)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return MEDJI_DATABASE['14'];

  // Taureau (20 avril - 20 mai)
  if (month === 4 && day >= 20) return MEDJI_DATABASE['13'];
  if (month === 5 && day <= 5) return MEDJI_DATABASE['13'];
  if (month === 5 && day >= 6 && day <= 20) return MEDJI_DATABASE['09'];

  // Gémeaux (21 mai - 20 juin)
  if (month === 5 && day >= 21) return MEDJI_DATABASE['03'];
  if (month === 6 && day <= 5) return MEDJI_DATABASE['03'];
  if (month === 6 && day >= 6 && day <= 20) return MEDJI_DATABASE['10'];

  // Cancer (21 juin - 22 juillet)
  if (month === 6 && day >= 21) return MEDJI_DATABASE['01'];
  if (month === 7 && day <= 6) return MEDJI_DATABASE['01'];
  if (month === 7 && day >= 7 && day <= 22) return MEDJI_DATABASE['02'];

  // Lion (23 juillet - 22 août)
  if (month === 7 && day >= 23) return MEDJI_DATABASE['05'];
  if (month === 8 && day <= 7) return MEDJI_DATABASE['05'];
  if (month === 8 && day >= 8 && day <= 22) return MEDJI_DATABASE['06'];

  // Vierge (23 août - 22 septembre)
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return MEDJI_DATABASE['12'];

  // Balance (23 septembre - 22 octobre)
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return MEDJI_DATABASE['07'];

  // Scorpion (23 octobre - 21 novembre)
  if (month === 10 && day >= 23) return MEDJI_DATABASE['11'];
  if (month === 11 && day <= 6) return MEDJI_DATABASE['11'];
  if (month === 11 && day >= 7 && day <= 21) return MEDJI_DATABASE['09'];

  // Sagittaire (22 novembre - 21 décembre)
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return MEDJI_DATABASE['16'];

  // Capricorne (22 décembre - 19 janvier)
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return MEDJI_DATABASE['04'];

  // Verseau (20 janvier - 18 février)
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return MEDJI_DATABASE['08'];

  // Poissons (19 février - 20 mars)
  return MEDJI_DATABASE['15'];
}

export function analyserProfilClient(dateIso: string): ProfilSpirituel | null {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null;
  const d = new Date(`${dateIso}T12:00:00Z`);
  const dayOfWeek = d.getUTCDay(); // 0: Dimanche, 1: Lundi ...
  const keys = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayKey = keys[dayOfWeek] || 'lundi';
  const jour = JOURS_DATA[dayKey];

  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const medji = getMedjiSign(month, day);
  const chemin = getCheminDeVie(dateIso);

  return {
    date_naissance: dateIso,
    jour_semaine: jour.jour,
    archange: jour.archange,
    archange_attribut: jour.archange_attribut,
    planete_regente: jour.planete,
    divinite_protectrice: jour.divinite_protectrice,
    couleurs_chance: jour.couleurs,
    animal_porte_bonheur: jour.animal,
    mots_cles: jour.mots_cles,
    psaume: jour.psaume,
    interdictions: jour.interdictions,
    metiers_recommandes: jour.metiers,
    vigilances_sante: jour.sante,
    signe_medji: medji,
    chemin_de_vie: chemin,
  };
}
