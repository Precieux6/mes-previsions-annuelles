#!/usr/bin/env python3
"""Contrôle des banques 2027 : volumes, structure, éligibilité, vocabulaire adouci."""
import json, glob, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assemble_2027 import DOMS, eligible, ROOT
INTERDITS = ["catastrophe", "mort", "décès", "déchéance", "malheur", "guerre", "maladie grave", "trahison", "ruine"]
SIGNES = ["belier","taureau","gemeaux","cancer","lion","vierge","balance","scorpion","sagittaire","capricorne","verseau","poissons"]
err, info = [], []
for path in sorted(glob.glob(os.path.join(ROOT, "mensuel", "*.json"))):
    d = json.load(open(path, encoding="utf-8"))
    if len(d["maisons_par_signe"]) != 12: err.append(f"{d['mois']} : maisons incomplètes")
    for dom in DOMS:
        frs = d["domaines"].get(dom, [])
        textes = [f["texte"] for f in frs]
        if len(frs) < 30: err.append(f"{d['mois']} {dom} : {len(frs)} fragments (min 30)")
        if len(set(textes)) != len(textes): err.append(f"{d['mois']} {dom} : doublons")
        for t in textes:
            for w in INTERDITS:
                if w in t.lower(): err.append(f"{d['mois']} {dom} : vocabulaire à adoucir « {w} »")
        for s in SIGNES:
            n = sum(1 for f in frs if eligible(f, d["maisons_par_signe"][s], dom))
            if n < 10: err.append(f"{d['mois']} {dom} {s} : {n} phrases éligibles (min 10)")
            info.append(n)
    print(f"{d['mois']} : éligibilité min {min(info[-60:])} / max {max(info[-60:])} par domaine-signe")
signes = glob.glob(os.path.join(ROOT, "signes", "*.json"))
if len(signes) != 12: err.append(f"signes : {len(signes)} fichiers (attendu 12)")
for path in signes:
    d = json.load(open(path, encoding="utf-8"))
    for dom in DOMS:
        if not d["domaines"].get(dom): err.append(f"{d['id']} {dom} : vide")
print(f"Erreurs : {len(err)}")
for e in err[:40]: print(" -", e)
sys.exit(1 if err else 0)
