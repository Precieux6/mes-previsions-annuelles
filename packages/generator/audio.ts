// Synthèse vocale avec Piper, dans le conteneur Railway. Pas de shell : le texte passe sur l'entrée standard.
import { spawn } from 'child_process';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface Piste { id: string; titre: string; texte: string }

function piperSynthese(texte: string, modele: string, sortie: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(process.env.PIPER_BIN ?? 'piper', ['--model', modele, '--output_file', sortie],
      { stdio: ['pipe', 'ignore', 'pipe'] });
    let erreur = '';
    p.stderr.on('data', (d) => { erreur += String(d); });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`piper a échoué (${code}) : ${erreur.slice(-300)}`))));
    p.stdin.end(texte, 'utf8');
  });
}

export async function genererAudios(pistes: Piste[]): Promise<Array<{ id: string; wav: Buffer }>> {
  const modele = process.env.PIPER_MODEL_PATH;
  if (!modele) throw new Error('PIPER_MODEL_PATH non configurée.');
  const dossier = await mkdtemp(join(tmpdir(), 'mpa-audio-'));
  try {
    const sorties: Array<{ id: string; wav: Buffer }> = [];
    for (const piste of pistes) {
      const fichier = join(dossier, `${piste.id}.wav`);
      await piperSynthese(piste.texte, modele, fichier);
      sorties.push({ id: piste.id, wav: await readFile(fichier) });
    }
    return sorties;
  } finally {
    await rm(dossier, { recursive: true, force: true });
  }
}
