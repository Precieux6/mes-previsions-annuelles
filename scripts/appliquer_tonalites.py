#!/usr/bin/env python3
"""Ajoute aux fragments mensuels le champ 'registres' (liste), calculé par tonalites_2027.registres_du_texte."""
import json, glob, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tonalites_2027 import registres_du_texte
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "banks", "2027", "mensuel")
for p in sorted(glob.glob(os.path.join(ROOT, "*.json"))):
    d = json.load(open(p, encoding="utf-8"))
    for dom, frs in d["domaines"].items():
        for f in frs:
            f["registres"] = registres_du_texte(f["texte"])
    json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(os.path.basename(p), {dom: sum(1 for f in frs if f["registres"]) for dom, frs in d["domaines"].items()}, "tagués sur", {dom: len(frs) for dom, frs in d["domaines"].items()})
