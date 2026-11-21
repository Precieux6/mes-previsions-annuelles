#!/usr/bin/env python3
"""Rapport personnalisé 2027 — mode « date » (astrologie tropicale + numérologie) ou « nom » (numérologie seule).
Entrée (stdin, JSON) : {"nom": str, "date_naissance": "AAAA-MM-JJ" | null, "signe": str | null}
Sortie (stdout, JSON) : profil, révélation annuelle (8 phrases max), douze mois (tendances, conseils, ciel).
"""
import json, os, random, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from assemble_2027 import assembler, DOMS
from conseils_2027 import conseils_mensuels, publiable, est_conseil, VALIDES
from tonalites_2027 import NOMBRE_VERS_REGISTRE, norm
from revelation_2027 import revelation
from profil_spirituel import analyser_profil_spirituel

BANQUES = os.path.join(HERE, "..", "banks", "2027", "mensuel")
ANNEE = 2027
SIGNES = {"belier", "taureau", "gemeaux", "cancer", "lion", "vierge",
          "balance", "scorpion", "sagittaire", "capricorne", "verseau", "poissons"}
ELEMENT = {"belier": "feu", "lion": "feu", "sagittaire": "feu", "taureau": "terre", "vierge": "terre",
           "capricorne": "terre", "gemeaux": "air", "balance": "air", "verseau": "air",
           "cancer": "eau", "scorpion": "eau", "poissons": "eau"}
LIBELLES = {"finances": "Finances", "sante": "Santé", "amour_famille": "Amour & famille",
            "vie_sociale": "Vie sociale", "travail": "Travail"}
MAITRES = {11, 22, 33}
VALEURS = {"a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6, "g": 7, "h": 8, "i": 9,
           "j": 1, "k": 2, "l": 3, "m": 4, "n": 5, "o": 6, "p": 7, "q": 8, "r": 9,
           "s": 1, "t": 2, "u": 3, "v": 4, "w": 5, "x": 6, "y": 7, "z": 8}
VOYELLES = set("aeiouy")
LARGE = re.compile(r"\b(peut|peuvent|invite|invitent|encourage|favorise|demande|demandent|conseille|gagne|gagnent|"
                   r"merite|meritent|vaut|prenez|faites|choisissez|evitez|gardez|prevoyez|notez|comparez|relisez|"
                   r"verifiez|ecrivez|dites|reservez|installez|pensez|soignez|renforcez|limitez|planifiez|demandez|"
                   r"osez|prudence|mieux)\b", re.I)


def reduire(n: int, garder_maitres: bool = False) -> int:
    while n > 9 and not (garder_maitres and n in MAITRES):
        n = sum(int(c) for c in str(n))
    return n


def annee_universelle() -> dict:
    """Double portée de l'année : nombre maître (11) et réduction (2), lus ensemble."""
    somme = sum(int(c) for c in str(ANNEE))
    maitre = reduire(somme, garder_maitres=True)
    return {"maitre": maitre, "reduit": reduire(maitre)}


UNIVERSELLE = annee_universelle()


def lettres(nom: str) -> str:
    nom = nom.replace("œ", "oe").replace("Œ", "OE").replace("æ", "ae").replace("Æ", "AE")
    return re.sub(r"[^a-z]", "", norm(nom))


def nombres_nom(nom: str) -> dict:
    l = lettres(nom)
    if len(l) < 2:
        raise ValueError("Nom trop court pour le calcul.")
    return {
        "expression": reduire(sum(VALEURS[c] for c in l), True),
        "ame": reduire(sum(VALEURS[c] for c in l if c in VOYELLES), True),
        "intime": reduire(sum(VALEURS[c] for c in l if c not in VOYELLES), True),
    }


def annee_personnelle(date: str) -> int:
    _, mois, jour = date.split("-")
    return reduire(reduire(int(jour)) + reduire(int(mois)) + reduire(ANNEE))


def score(f: dict, regs: list) -> int:
    return sum(2 for r in regs if r in f.get("registres", []))


def tendances_nom(doc: dict, regs: list, graine: str) -> dict:
    rnd = random.Random(graine)
    out = {}
    for dom in DOMS:
        pool = [f for f in doc["domaines"][dom] if not f["planetes"]]
        if len(pool) < 10:
            raise RuntimeError(f"{doc['mois']} {dom} : {len(pool)} fragments génériques (10 requis).")
        rnd.shuffle(pool)
        pool.sort(key=lambda f: -score(f, regs))
        out[dom] = [f["texte"] for f in pool[:10]]
    return out


def conseils_nom(doc: dict, regs: list, graine: str) -> list:
    rnd = random.Random(graine)
    out = []
    for dom in DOMS:
        pool = [f for f in doc["domaines"][dom] if not f["planetes"]
                and (est_conseil(f["texte"]) or LARGE.search(norm(f["texte"])))]
        rnd.shuffle(pool)
        pool.sort(key=lambda f: -score(f, regs))
        for f in pool[:2]:
            out.append({"domaine": LIBELLES[dom], "texte": f["texte"], "valide": f["texte"] in VALIDES})
    return publiable(out)


def rapport(entree: dict) -> dict:
    nom = (entree.get("nom") or "").strip()
    if len(lettres(nom)) < 2:
        raise ValueError("Nom invalide.")
    date = entree.get("date_naissance") or None
    signe = entree.get("signe") or None
    nb = nombres_nom(nom)
    graine = nom.lower()

    if date:
        if signe not in SIGNES:
            raise ValueError(f"Signe inconnu : {signe}")
        mode, ap, cycle = "date", annee_personnelle(date), "personnel"
        element = ELEMENT[signe]
    else:
        # Sans date : le cycle est l'année universelle, réduite à 2 pour les calculs mensuels.
        mode, ap, cycle = "nom", UNIVERSELLE["reduit"], "universel"
        signe, element = None, None

    mois_sortie = []
    for m in range(1, 13):
        id_mois = f"2027-{m:02d}"
        with open(os.path.join(BANQUES, f"{id_mois}.json"), encoding="utf-8") as f:
            doc = json.load(f)
        mp = reduire(ap + m)
        if mode == "date":
            profil = {"annee_personnelle": ap, "mois_personnel": mp, "date_naissance": date,
                      "nombre_nom": nb["expression"]}
            tendances = assembler(doc, signe, 10, m, profil)
            conseils = publiable(conseils_mensuels(doc, signe, profil))
        else:
            regs = [NOMBRE_VERS_REGISTRE[mp], NOMBRE_VERS_REGISTRE[nb["expression"]]]
            tendances = tendances_nom(doc, regs, f"nom|{graine}|{m}")
            conseils = conseils_nom(doc, regs, f"conseil|{graine}|{m}")
        mois_sortie.append({
            "mois": id_mois, "libelle_cycle": cycle, "annee_personnelle": ap, "mois_personnel": mp,
            "ciel": doc.get("ciel", ""), "tonalite": doc.get("tonalite", ""),
            "tendances": tendances, "conseils": conseils,
        })

    profil_dict = {
        "nom": nom, "mode": mode, "signe": signe, "libelle_cycle": cycle,
        "annee_personnelle": ap,
        "annee_universelle": dict(UNIVERSELLE),
        "nombre_expression": nb["expression"], "nombre_ame": nb["ame"], "nombre_intime": nb["intime"],
    }
    if date:
        try:
            profil_dict["spirituel"] = analyser_profil_spirituel(date)
        except Exception as e:
            print(f"rapport_2027 : profil spirituel ignoré ({e})", file=sys.stderr)

    return {
        "profil": profil_dict,
        "revelation": revelation(ap, nb["expression"], nb["ame"], element, UNIVERSELLE),
        "mois": mois_sortie,
    }


if __name__ == "__main__":
    try:
        json.dump(rapport(json.load(sys.stdin)), sys.stdout, ensure_ascii=False)
    except Exception as e:
        print(f"rapport_2027 : {e}", file=sys.stderr)
        sys.exit(1)
