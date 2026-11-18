#!/usr/bin/env python3
"""Mesure de variété : pour chaque mois, signe et domaine, 10 phrases garanties et profils différents donnent des textes différents."""
import json, glob, os, random, sys, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assemble_2027 import assembler, DOMS, ROOT
SIGNES = ["belier","taureau","gemeaux","cancer","lion","vierge","balance","scorpion","sagittaire","capricorne","verseau","poissons"]
rnd = random.Random(2027)
erreurs, jaccards, identiques = [], [], 0
for path in sorted(glob.glob(os.path.join(ROOT, "mensuel", "*.json"))):
    d = json.load(open(path, encoding="utf-8"))
    for signe in SIGNES:
        ensembles = []
        for _ in range(60):   # 60 profils par signe et par mois
            prof = {"annee_personnelle": rnd.randint(1,9), "mois_personnel": rnd.randint(1,9),
                    "date_naissance": f"{rnd.randint(1950,2008)}-{rnd.randint(1,12):02d}-{rnd.randint(1,28):02d}",
                    "nombre_nom": rnd.randint(1,9)}
            r = assembler(d, signe, 10, 1, prof)
            for dom in DOMS:
                if len(r[dom]) != 10 or len(set(r[dom])) != 10:
                    erreurs.append(f"{d['mois']} {signe} {dom} : {len(r[dom])} phrases, uniques={len(set(r[dom]))}")
            ensembles.append({(dom, t) for dom in DOMS for t in r[dom]})
        for a, b in itertools.combinations(ensembles[:20], 2):
            if a == b: identiques += 1
            jaccards.append(len(a & b) / len(a | b))
    moy = sum(jaccards[-190:]) / 190
    print(f"{d['mois']} : recouvrement moyen entre deux lecteurs du même signe = {moy:.2f}")
print(f"Paires de profils identiques : {identiques} / {len(jaccards)}")
print(f"Erreurs de garantie (10 phrases uniques par domaine) : {len(erreurs)}")
for e in erreurs[:20]: print(" -", e)
sys.exit(1 if erreurs else 0)
