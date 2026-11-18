#!/usr/bin/env python3
"""Couche « conseils du mois » : quelques conseils pratiques par domaine, tirés des fragments mensuels.

Un conseil est un fragment formulé comme une action (verbe d'action, « gagne à », « mérite », « se prépare »…),
choisi en priorité selon le registre de l'année et du mois personnels, comme la tendance.
Chaque conseil porte le champ 'valide' : seuls les fragments validés par la relecture éditoriale
peuvent être publiés. Tant que VALIDES est vide, aucun conseil n'est publiable.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assemble_2027 import eligible, MAISONS_DOMAINE
from tonalites_2027 import NOMBRE_VERS_REGISTRE, norm

# Fragments validés par M. Tossou (identifiés par leur texte). Vide tant que la relecture n'est pas signée.
_VAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "validations", "relecture_2027.json")
VALIDES = set(json.load(open(_VAL, encoding="utf-8"))["textes"]) if os.path.exists(_VAL) and json.load(open(_VAL, encoding="utf-8")).get("approuve") else set()

ACTION = re.compile(r"^(prenez|gardez|fixez|prevoyez|notez|faites|choisissez|privilegiez|evitez|comparez|reservez|relisez|demandez|planifiez|verifiez|ecrivez|dites|osez|accordez|preparez|installez|soignez|renforcez|limitez|pensez)\b|\b(gagne|gagnent|merite|meritent|se prepare|se prepare|se compare|se verifie|se revoit|peut etre utile|vaut la peine|gagnerait|invite a|encourage a)\b", re.I)
LABEL = {"finances": "Finances", "sante": "Santé", "amour_famille": "Amour & famille", "vie_sociale": "Vie sociale", "travail": "Travail"}

def est_conseil(texte):
    return bool(ACTION.search(norm(texte)))

def conseils_mensuels(mois_doc, signe, profil=None, par_domaine=2):
    p = profil or {}
    reg_ap = NOMBRE_VERS_REGISTRE.get(p.get("annee_personnelle"))
    reg_mp = NOMBRE_VERS_REGISTRE.get(p.get("mois_personnel"))
    maisons = mois_doc["maisons_par_signe"][signe]
    out = []
    for dom in LABEL:
        pool = [f for f in mois_doc["domaines"][dom] if eligible(f, maisons, dom) and est_conseil(f["texte"])]
        def score(f):
            regs = f.get("registres", [])
            return (2 if reg_ap in regs else 0) + (2 if reg_mp in regs else 0)
        pool.sort(key=lambda f: (-score(f), f["texte"]))
        for f in pool[:par_domaine]:
            out.append({"domaine": LABEL[dom], "texte": f["texte"], "valide": f["texte"] in VALIDES})
    return out

def publiable(conseils):
    """Ne renvoie que les conseils validés. Un lot avec des conseils non validés est refusé en production."""
    return [c for c in conseils if c["valide"]]
