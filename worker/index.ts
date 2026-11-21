// Worker « Mes prévisions annuelles » — mode requête (Hugging Face Spaces + cron-job.org).
// Chaque appel POST /traiter (protégé par le jeton X-Worker-Token) lance un lot en arrière-plan.
import http from 'http';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../api/_lib/db';
import { getTropicalSnapshot } from '../packages/engine/tropical';
import { genererPdf, type ContenuCommun, type DonneesPDF, type Rapport } from '../packages/generator/pdf';
import { genererAudios, type Piste } from '../packages/generator/audio';
import { genererRecu, codeVerification } from '../packages/generator/receipt';
import { envoyerDocument } from '../packages/storage/r2';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_TENTATIVES = 3;
const SENTINELLE_SANS_DATE = 'nom_seul';
const BUDGET_MS = 6 * 60 * 1000;          // on ne démarre pas de nouvelle commande au-delà
const PORT = Number(process.env.PORT ?? 7860);
const WORKER_TOKEN = process.env.WORKER_TOKEN ?? '';
const pool = getPool();
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];

interface Job { id: number; order_id: number; attempts: number }
interface Commande {
  id: number; reference: string; full_name: string; sign_id: string; birthdate: string | null;
  payment_amount: string; payment_transaction_id: string;
}

function genererRapport(entree: { nom: string; date_naissance: string | null; signe: string | null }): Promise<Rapport> {
  return new Promise((resolve, reject) => {
    const p = spawn(process.env.PYTHON_BIN ?? 'python3', [join(ROOT, 'scripts', 'rapport_2027.py')], { stdio: ['pipe', 'pipe', 'pipe'] });
    let sortie = '';
    let erreur = '';
    p.stdout.on('data', (d) => { sortie += String(d); });
    p.stderr.on('data', (d) => { erreur += String(d); });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(erreur.trim() || `rapport_2027 a échoué (${code})`));
      try { resolve(JSON.parse(sortie) as Rapport); } catch (e) { reject(e); }
    });
    p.stdin.end(JSON.stringify(entree), 'utf8');
  });
}

/** Refuse la production si un fichier de validation n'est pas approuvé. */
function verifierValidations(): void {
  for (const f of ['relecture_2027.json', 'relecture_annuel_2027.json']) {
    const v = JSON.parse(readFileSync(join(ROOT, 'validations', f), 'utf8')) as { approuve?: boolean };
    if (v.approuve !== true) throw new Error(`Validation non approuvée : ${f}`);
  }
}

/** Contenu commun : refuse la production si une section n'est pas validée. */
function lireCommun(): ContenuCommun {
  const brut = JSON.parse(readFileSync(join(ROOT, 'contenu', '2027', 'commun.json'), 'utf8'));
  const sec = (id: string) => {
    const s = brut.sections.find((x: { id: string }) => x.id === id);
    if (!s) throw new Error(`Section commune absente : ${id}`);
    if (!['valide', 'valide_par_delegation'].includes(s.statut)) throw new Error(`Section commune non validée : ${id}`);
    return s;
  };
  const g = sec('grandes_tendances');
  const th = sec('tendances_thematiques');
  const cg = sec('conseils_generaux');
  const cy = sec('cycles_personnels');
  const sy = sec('synthese');
  const anges = JSON.parse(readFileSync(join(ROOT, 'contenu', '2027', 'anges_2027.json'), 'utf8')).anges as
    Array<{ nom: string; debut: string; fin: string }>;
  const fmt = (iso: string) => `${Number(iso.slice(8, 10))} ${MOIS_FR[Number(iso.slice(5, 7)) - 1]}`;
  return {
    grandes: {
      paragraphes: g.paragraphes,
      annee_universelle: g.annee_universelle ?? [],
      axes: g.axes ?? [],
      calendrier: g.calendrier_transits ?? [],
    },
    thematiques: th.themes.map((t: { libelle: string; phrases: string[] }) => ({ libelle: t.libelle, phrases: t.phrases })),
    cycles: cy.paragraphes,
    anges: anges.map((a) => `${a.nom} : du ${fmt(a.debut)} au ${fmt(a.fin)}`),
    conseils_generaux: cg.phrases,
    synthese: sy.paragraphes ?? [],
  };
}

function construirePistes(rapport: Rapport, commun: ContenuCommun): Piste[] {
  const pistes: Piste[] = rapport.mois.map((m, i) => ({
    id: `audio_${String(i + 1).padStart(2, '0')}`,
    titre: `Prévisions de ${MOIS_FR[i]} 2027`,
    texte: [`Prévisions de ${MOIS_FR[i]} 2027.`, m.ciel, `Tonalité du mois : ${m.tonalite}`,
      ...Object.values(m.tendances).flat(), 'Conseils pratiques.', ...m.conseils.map((c) => c.texte)].join(' '),
  }));
  pistes.push({ id: 'audio_annuel', titre: 'Révélation annuelle', texte: rapport.revelation.join(' ') });
  pistes.push({ id: 'audio_tendances', titre: 'Grandes tendances 2027', texte: commun.grandes.paragraphes.join(' ') });
  return pistes;
}

async function enregistrerDocument(orderId: number, type: string, key: string, taille: number, sha256: string, mime: string) {
  await pool.query(
    `INSERT INTO documents (order_id, doc_type, storage_key, mime_type, size_bytes, sha256)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (order_id, doc_type) DO UPDATE SET storage_key = EXCLUDED.storage_key,
       mime_type = EXCLUDED.mime_type, size_bytes = EXCLUDED.size_bytes, sha256 = EXCLUDED.sha256, created_at = now()`,
    [orderId, type, key, mime, taille, sha256]);
}

async function traiterCommande(job: Job): Promise<void> {
  const r = await pool.query<Commande>(
    `SELECT o.id, o.reference, o.full_name, o.sign_id, o.birthdate,
            p.amount AS payment_amount, p.transaction_id AS payment_transaction_id
     FROM orders o JOIN payments p ON p.order_id = o.id AND p.status = 'approved'
     WHERE o.id = $1 ORDER BY p.id DESC LIMIT 1`, [job.order_id]);
  const cmd = r.rows[0];
  if (!cmd) throw new Error(`Commande ${job.order_id} introuvable ou non payée.`);

  verifierValidations();
  const commun = lireCommun();
  const dateNaissance = cmd.birthdate ? String(cmd.birthdate).slice(0, 10) : null;
  const signe = dateNaissance && cmd.sign_id !== SENTINELLE_SANS_DATE ? cmd.sign_id : null;
  const rapport = await genererRapport({ nom: cmd.full_name, date_naissance: dateNaissance, signe });
  const transits = dateNaissance ? getTropicalSnapshot(new Date('2027-01-01T12:00:00Z')) : {};

  // 1. Document de 36 pages
  const pdf = await genererPdf({ rapport, dateNaissance, commun, transits } as DonneesPDF);
  const clePdf = `documents/${cmd.reference}/pdf_36_pages.pdf`;
  const envoiPdf = await envoyerDocument(clePdf, pdf, 'application/pdf');
  await enregistrerDocument(cmd.id, 'pdf_36_pages', clePdf, envoiPdf.sizeBytes, envoiPdf.sha256, 'application/pdf');

  // 2. Reçu
  const montant = Number(cmd.payment_amount);
  const recu = await genererRecu({ reference: cmd.reference, nomClient: cmd.full_name, montant, devise: 'XOF',
    dateEmission: new Date(), numeroTransaction: cmd.payment_transaction_id, baseUrl: process.env.PUBLIC_BASE_URL! });
  const cleRecu = `documents/${cmd.reference}/receipt_pdf.pdf`;
  const envoiRecu = await envoyerDocument(cleRecu, recu.pdf, 'application/pdf');
  await enregistrerDocument(cmd.id, 'receipt_pdf', cleRecu, envoiRecu.sizeBytes, envoiRecu.sha256, 'application/pdf');
  const initiales = cmd.full_name.split(/\s+/).map((m) => m[0]?.toUpperCase() ?? '').join('').slice(0, 4);
  await pool.query(
    `INSERT INTO receipts (order_id, receipt_number, verify_code, buyer_initials, amount)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (verify_code) DO NOTHING`,
    [cmd.id, `RC-${cmd.reference}`, codeVerification(cmd.reference), initiales, montant]);

  // 3. Audios
  const audios = await genererAudios(construirePistes(rapport, commun));
  for (const a of audios) {
    const cle = `documents/${cmd.reference}/audios/${a.id}.wav`;
    const envoi = await envoyerDocument(cle, a.wav, 'audio/wav');
    await enregistrerDocument(cmd.id, a.id, cle, envoi.sizeBytes, envoi.sha256, 'audio/wav');
  }

  // 4. Clôture
  await pool.query(`UPDATE orders SET status = 'completed' WHERE id = $1`, [cmd.id]);
  await pool.query(`UPDATE jobs SET status = 'completed', error_message = NULL WHERE id = $1`, [job.id]);
}

/** Réserve le prochain job en attente. Le verrou SKIP LOCKED évite que deux traitements prennent le même job. */
async function reclamerJob(): Promise<Job | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query<Job>(
      `SELECT id, order_id, attempts FROM jobs WHERE status = 'pending' AND attempts < $1
       ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`, [MAX_TENTATIVES]);
    const job = r.rows[0];
    if (!job) { await client.query('COMMIT'); return null; }
    await client.query(
      `UPDATE jobs SET status = 'processing', attempts = attempts + 1, started_at = now() WHERE id = $1`, [job.id]);
    await client.query('COMMIT');
    return job;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function echecJob(job: Job, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Job ${job.id} (commande ${job.order_id}) en échec :`, message);
  const definitif = job.attempts + 1 >= MAX_TENTATIVES;
  await pool.query(`UPDATE jobs SET status = $2, error_message = $3 WHERE id = $1`,
    [job.id, definitif ? 'failed' : 'pending', message.slice(0, 2000)]);
  if (definitif) await pool.query(`UPDATE orders SET status = 'failed' WHERE id = $1`, [job.order_id]);
}

/** Un job resté « processing » depuis plus de 30 minutes (instance arrêtée en plein travail) repasse en attente. */
async function reprendreJobsBloques() {
  await pool.query(`UPDATE jobs SET status = 'pending'
                    WHERE status = 'processing' AND started_at < now() - interval '30 minutes'`);
}

/** Traite les jobs en attente tant que le budget de temps n'est pas dépassé. */
export async function traiterLot(): Promise<{ traites: number; echecs: number }> {
  const debut = Date.now();
  let traites = 0;
  let echecs = 0;
  await reprendreJobsBloques();
  while (Date.now() - debut < BUDGET_MS) {
    const job = await reclamerJob();
    if (!job) break;
    try {
      await traiterCommande(job);
      traites++;
      console.log(`Job ${job.id} terminé.`);
    } catch (err) {
      echecs++;
      await echecJob(job, err).catch((e) => console.error('Mise à jour du job impossible :', e));
    }
  }
  return { traites, echecs };
}

/** Lot en cours : un seul à la fois, même si cron-job.org sollicite le worker plusieurs fois. */
let enCours = false;

function lancerLot(): void {
  enCours = true;
  traiterLot()
    .then((r) => console.log('Lot terminé :', JSON.stringify(r)))
    .catch((err) => console.error('Erreur de traitement :', err))
    .finally(() => { enCours = false; });
}

const serveur = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  if (req.method === 'POST' && req.url === '/traiter') {
    if (!WORKER_TOKEN || req.headers['x-worker-token'] !== WORKER_TOKEN) {
      res.writeHead(401);
      return res.end();
    }
    if (enCours) {
      res.writeHead(202, { 'Content-Type': 'text/plain' });
      return res.end('traitement déjà en cours');
    }
    lancerLot();
    res.writeHead(202, { 'Content-Type': 'text/plain' });
    return res.end('lot lancé');
  }
  res.writeHead(404);
  res.end();
});

serveur.listen(PORT, () => console.log(`Worker « Mes prévisions annuelles » à l'écoute sur le port ${PORT}.`));
