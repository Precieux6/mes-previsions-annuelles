// Document de 36 pages, corps 10 pt, interligne 1,2 (option C retenue).
// Chaque page a une hauteur fixe : un débordement fait échouer la génération.
import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

export const NB_PAGES = 38;
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];

export interface Conseil { domaine: string; texte: string; valide: boolean }
export interface MoisDonnees {
  mois: string; libelle_cycle: 'personnel' | 'universel'; annee_personnelle: number; mois_personnel: number;
  ciel: string; tonalite: string; tendances: Record<string, string[]>; conseils: Conseil[];
}
export interface AnneeUniverselle { maitre: number; reduit: number }
export interface Profil {
  nom: string; mode: 'date' | 'nom'; signe: string | null; libelle_cycle: 'personnel' | 'universel';
  annee_personnelle: number; annee_universelle: AnneeUniverselle;
  nombre_expression: number; nombre_ame: number; nombre_intime: number;
}
export interface Rapport { profil: Profil; revelation: string[]; mois: MoisDonnees[] }
export interface Transit { planete: string; signe: string; degre: number; retrograde: boolean }

export interface ContenuCommun {
  grandes: {
    paragraphes: string[];
    annee_universelle: string[];
    axes: Array<{ domaine: string; points: string[] }>;
    calendrier: string[];
  };
  thematiques: Array<{ libelle: string; phrases: string[] }>;
  cycles: string[];
  anges: string[];
  conseils_generaux: string[];
  synthese: string[];
}

export interface DonneesPDF {
  rapport: Rapport;
  dateNaissance: string | null;
  commun: ContenuCommun;
  transits: Record<string, Transit>;
}

type Item = { k: 's' | 'p' | 'c'; t: string };

const SHELL = readFileSync(fileURLToPath(new URL('./template.html', import.meta.url)), 'utf8');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pied = (n: number) => `<div class="pied">Mes prévisions annuelles 2027 — document confidentiel — page ${n} / ${NB_PAGES}</div>`;
const page = (corps: string) => `<section class="page">${corps}</section>`;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const universelleLibelle = (u: AnneeUniverselle) => `${u.maitre} (nombre maître), réduit à ${u.reduit}`;

/** Répartit des éléments sur n pages, en équilibrant la longueur de texte. */
function repartir(items: Item[], n: number): Item[][] {
  const poids = (i: Item) => i.t.length + (i.k === 's' ? 60 : 0);
  const total = items.reduce((s, i) => s + poids(i), 0);
  const cible = total / n;
  const pages: Item[][] = Array.from({ length: n }, () => []);
  let page = 0;
  let acc = 0;
  for (const it of items) {
    if (acc >= cible * (page + 1) && page < n - 1) page++;
    pages[page]!.push(it);
    acc += poids(it);
  }
  return pages;
}

const rendre = (items: Item[]) => items.map((i) => {
  if (i.k === 's') return `<h3>${esc(i.t)}</h3>`;
  if (i.k === 'p') return `<p>${esc(i.t)}</p>`;
  return `<div class="ligne">${esc(i.t)}</div>`;
}).join('');

function sectionEnPages(titre: string, items: Item[], n: number, numeroDepart: number): string[] {
  return repartir(items, n).map((m, i) =>
    page(`<h2>${esc(i === 0 ? titre : `${titre} (suite)`)}</h2>${rendre(m)}${pied(numeroDepart + i)}`));
}

function couverture(d: DonneesPDF): string {
  const p = d.rapport.profil;
  const parNom = p.mode === 'nom';
  const lignes = parNom
    ? '<p><strong>Mode :</strong> prénoms et nom complets (date de naissance non renseignée)</p>'
    : `<p><strong>Signe :</strong> ${esc(p.signe ?? '')}</p><p><strong>Date de naissance :</strong> ${esc(d.dateNaissance ?? '')}</p>`;
  const cycle = parNom ? 'Cycle universel 2027' : 'Année personnelle 2027';
  return page(`
    <div class="cover" style="position:absolute;inset:0;padding:16mm 18mm">
      <h1>Mes prévisions annuelles</h1>
      <h2>Édition 2027</h2>
      <p>${parNom ? 'Étude personnalisée par numérologie' : 'Étude personnalisée en astrologie tropicale et numérologie'}</p>
      <div class="meta">
        <p><strong>Établi pour :</strong> ${esc(p.nom)}</p>
        ${lignes}
        <p><strong>${cycle} :</strong> ${p.annee_personnelle}</p>
        <p><strong>Année universelle 2027 :</strong> ${esc(universelleLibelle(p.annee_universelle))}</p>
      </div>
    </div>`);
}

function itemsGrandes(g: ContenuCommun['grandes']): Item[] {
  const it: Item[] = g.paragraphes.map((t) => ({ k: 'p', t }));
  it.push({ k: 's', t: 'Année universelle 2027' });
  g.annee_universelle.forEach((t) => it.push({ k: 'p', t }));
  it.push({ k: 's', t: "Axes de l'année" });
  for (const a of g.axes) {
    it.push({ k: 's', t: a.domaine });
    a.points.forEach((t) => it.push({ k: 'p', t }));
  }
  it.push({ k: 's', t: 'Repères du calendrier' });
  g.calendrier.forEach((t) => it.push({ k: 'c', t }));
  return it;
}

function itemsThematiques(th: ContenuCommun['thematiques']): Item[] {
  const it: Item[] = [];
  for (const t of th) {
    it.push({ k: 's', t: t.libelle });
    t.phrases.forEach((p) => it.push({ k: 'p', t: p }));
  }
  return it;
}

function pageCentrale(d: DonneesPDF, n: number): string {
  const p = d.rapport.profil;
  if (p.mode === 'date') {
    const lignes = Object.values(d.transits).map((t) =>
      `<tr><td>${esc(t.planete)}</td><td>${esc(t.signe)}</td><td>${t.degre.toFixed(2)}°</td><td>${t.retrograde ? 'Rétrograde' : 'Direct'}</td></tr>`).join('');
    return page(`<h2>Transits de référence (1er janvier 2027)</h2>
      <table><tr><th>Planète</th><th>Signe</th><th>Degré</th><th>Mouvement</th></tr>${lignes}</table>${pied(n)}`);
  }
  const lignes: Array<[string, string | number]> = [
    ["Nombre d'expression (prénoms et nom)", p.nombre_expression],
    ['Élan spirituel (voyelles du nom)', p.nombre_ame],
    ['Nombre intime (consonnes du nom)', p.nombre_intime],
    ['Année universelle 2027', universelleLibelle(p.annee_universelle)],
  ];
  const t = lignes.map(([l, v]) => `<tr><td>${esc(l)}</td><td>${esc(String(v))}</td></tr>`).join('');
  return page(`<h2>Les nombres de votre nom</h2>
    <p>Ce profil s'appuie uniquement sur vos prénoms et votre nom complets.</p>
    <table><tr><th>Repère</th><th>Nombre</th></tr>${t}</table>${pied(n)}`);
}

function pagesMois(m: MoisDonnees, n: number): string[] {
  const nom = majuscule(MOIS_FR[Number(m.mois.slice(5, 7)) - 1]!);
  const cycle = m.libelle_cycle === 'universel' ? 'Cycle universel' : 'Année personnelle';
  const moisL = m.libelle_cycle === 'universel' ? 'mois universel' : 'mois personnel';
  const dom = (cle: string, libelle: string) =>
    `<div class="domaine"><h3>${esc(libelle)}</h3>${(m.tendances[cle] ?? []).map((t) => `<p>${esc(t)}</p>`).join('')}</div>`;
  const doms: Array<[string, string]> = [['finances', 'Finances & argent'], ['sante', 'Santé & énergie'],
    ['amour_famille', 'Amour & famille'], ['vie_sociale', 'Vie sociale'], ['travail', 'Travail & réalités professionnelles']];
  const a = page(`<h2>${esc(nom)} 2027</h2>
    <p class="ciel">${esc(m.ciel)}</p>
    <p><strong>Tonalité du mois :</strong> ${esc(m.tonalite)}</p>
    <p>${cycle} ${m.annee_personnelle} · ${moisL} ${m.mois_personnel}</p>
    ${doms.slice(0, 3).map(([c, l]) => dom(c, l)).join('')}${pied(n)}`);
  const conseils = m.conseils.map((c) => `<div class="conseil"><small>${esc(c.domaine)}</small>${esc(c.texte)}</div>`).join('');
  const b = page(`<h2>${esc(nom)} 2027 (suite)</h2>
    ${doms.slice(3).map(([c, l]) => dom(c, l)).join('')}
    <h3>Conseils pratiques du mois</h3>${conseils || '<p>Aucun conseil pour ce mois.</p>'}${pied(n + 1)}`);
  return [a, b];
}

/** Assemble le document. Plan : 1 couverture, 3 grandes tendances, 1 page centrale, 3 thèmes,
 *  1 révélation, 2 anges, 1 conseils et synthèse, puis 24 pages mensuelles = 36. */
export function construireHtml(d: DonneesPDF): string {
  const pages: string[] = [couverture(d)];
  let n = 2;
  const ajouter = (lot: string[]) => { pages.push(...lot); n += lot.length; };

  ajouter(sectionEnPages('Grandes tendances 2027', itemsGrandes(d.commun.grandes), 3, n));
  ajouter([pageCentrale(d, n)]);
  ajouter(sectionEnPages("Tendances de l'année par thème", itemsThematiques(d.commun.thematiques), 3, n));
  ajouter(sectionEnPages('Année personnelle et cycle universel',
    d.commun.cycles.map((t) => ({ k: 'p' as const, t })), 2, n));
  ajouter(sectionEnPages('Votre révélation annuelle 2027',
    d.rapport.revelation.map((t) => ({ k: 'p' as const, t })), 1, n));
  ajouter(sectionEnPages("Les anges de l'année 2027", d.commun.anges.map((t) => ({ k: 'c' as const, t })), 2, n));
  const fin: Item[] = [{ k: 's', t: 'Conseils généraux' }, ...d.commun.conseils_generaux.map((t, i) => ({ k: 'c' as const, t: `${i + 1}. ${t}` })),
    { k: 's', t: 'Synthèse et orientations' }, ...d.commun.synthese.map((t) => ({ k: 'p' as const, t }))];
  ajouter(sectionEnPages('Conseils et synthèse', fin, 1, n));
  for (const m of d.rapport.mois) ajouter(pagesMois(m, n));

  if (pages.length !== NB_PAGES) throw new Error(`Génération : ${pages.length} pages au lieu de ${NB_PAGES}.`);
  return SHELL.replace('{{CORPS}}', () => pages.join('\n'));
}

export async function genererPdf(d: DonneesPDF): Promise<Buffer> {
  const html = construireHtml(d);
  const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await navigateur.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const debordements = await page.evaluate(() =>
      [...document.querySelectorAll('.page')].map((el, i) => (el.scrollHeight > el.clientHeight + 2 ? i + 1 : 0)).filter((n) => n > 0));
    if (debordements.length > 0) throw new Error(`Texte trop long, débordement sur les pages : ${debordements.join(', ')}`);
    const pdf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }));
    const verif = await PDFDocument.load(pdf);
    if (verif.getPageCount() !== NB_PAGES) throw new Error(`PDF : ${verif.getPageCount()} pages au lieu de ${NB_PAGES}.`);
    return pdf;
  } finally {
    await navigateur.close();
  }
}
