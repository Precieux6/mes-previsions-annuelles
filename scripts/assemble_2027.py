#!/usr/bin/env python3
"""Assemblage déterministe des tendances mensuelles 2027 (référence de l'implémentation TypeScript).

Un fragment tagué planète n'est éligible que si la maison de cette planète, pour le signe du lecteur,
appartient aux maisons activant le domaine. Un fragment générique ou de lunaison est toujours éligible.
La sélection est graînée par (mois, signe, graine) : même entrée, même texte ; sans répétition dans un domaine.
"""
import json, random, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "banks", "2027")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tonalites_2027 import NOMBRE_VERS_REGISTRE
DOMS = ["finances", "sante", "amour_famille", "vie_sociale", "travail"]
MAISONS_DOMAINE = {"finances": {2, 8, 11}, "sante": {1, 6, 12}, "amour_famille": {4, 5, 7}, "vie_sociale": {3, 9, 11}, "travail": {6, 9, 10}}

def eligible(frag, maisons_signe, dom):
    if not frag["planetes"]:
        return True
    for p in frag["planetes"]:
        h = maisons_signe.get(p)
        if h is not None and h in MAISONS_DOMAINE[dom]:
            return True
    return False

def assembler(mois_doc, signe, nb=10, graine=0, profil=None):
    """profil : dict optionnel {annee_personnelle, mois_personnel, date_naissance, nombre_nom}.

    Les fragments éligibles sont classés par registre : ceux qui correspondent à l'année personnelle
    et au mois personnel du lecteur passent en tête (+2 chacun). L'aléa graîné départage les ex æquo.
    Sans profil, le classement est purement aléatoire, comme avant.
    """
    p = profil or {}
    cle = "|".join(str(x) for x in [mois_doc["mois"], signe, graine,
                                    p.get("annee_personnelle"), p.get("mois_personnel"),
                                    p.get("date_naissance"), p.get("nombre_nom")])
    rnd = random.Random(cle)
    maisons = mois_doc["maisons_par_signe"][signe]
    reg_ap = NOMBRE_VERS_REGISTRE.get(p.get("annee_personnelle")) if p.get("annee_personnelle") else None
    reg_mp = NOMBRE_VERS_REGISTRE.get(p.get("mois_personnel")) if p.get("mois_personnel") else None
    out = {}
    for dom in DOMS:
        pool = [f for f in mois_doc["domaines"][dom] if eligible(f, maisons, dom)]
        rnd.shuffle(pool)
        def score(f):
            regs = f.get("registres", [])
            return (2 if reg_ap in regs else 0) + (2 if reg_mp in regs else 0)
        pool.sort(key=score, reverse=True)  # tri stable : l'ordre aléatoire départage les ex æquo
        out[dom] = [f["texte"] for f in pool[:nb]]
    return out

if __name__ == "__main__":
    mois = sys.argv[1] if len(sys.argv) > 1 else "2027-01"
    signe = sys.argv[2] if len(sys.argv) > 2 else "belier"
    doc = json.load(open(os.path.join(ROOT, "mensuel", f"{mois}.json"), encoding="utf-8"))
    print(json.dumps(assembler(doc, signe, 10, 1), ensure_ascii=False, indent=2))
