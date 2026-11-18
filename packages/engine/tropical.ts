// Positions tropicales des planètes lentes, avec détection de rétrogradation.
import * as Astronomy from 'astronomy-engine';

export const SIGNES_TROPICAUX = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge',
  'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'] as const;

const PLANETES: Record<string, Astronomy.Body> = {
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturne: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluton: Astronomy.Body.Pluto,
};

export interface PositionPlanete { planete: string; signe: string; degre: number; retrograde: boolean }

const normaliser = (x: number) => ((x % 360) + 360) % 360;

function longitudeTropicale(corps: Astronomy.Body, date: Date): number {
  const vecteur = Astronomy.GeoVector(corps, date, true);
  return normaliser(Astronomy.Ecliptic(vecteur).elon);
}

export function getTropicalSnapshot(date: Date): Record<string, PositionPlanete> {
  const veille = new Date(date.getTime() - 86_400_000);
  const out: Record<string, PositionPlanete> = {};
  for (const [nom, corps] of Object.entries(PLANETES)) {
    const lon = longitudeTropicale(corps, date);
    const avant = longitudeTropicale(corps, veille);
    const delta = ((lon - avant + 540) % 360) - 180;
    out[nom] = {
      planete: nom,
      signe: SIGNES_TROPICAUX[Math.floor(lon / 30)]!,
      degre: Math.round((lon % 30) * 100) / 100,
      retrograde: delta < 0,
    };
  }
  return out;
}
