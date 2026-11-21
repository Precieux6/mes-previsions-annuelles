#!/usr/bin/env python3
"""Profil spirituel : jour de naissance, signe Mêdji (Fâ) et archange de période.

Sources (contenu/2027/) — source unique, partagée avec src/lib/spiritualProfile.ts :
- jours_naissance.json      : référence « Tout savoir sur votre jour de naissance », complétée par « L'influence des jours de naissance ».
- geomancie_medji.json      : 16 signes Mêdji (manuscrit de référence).
- geomancie_periodes.json   : découpage des signes en périodes (MM-JJ).
- anges_2027.json           : périodes des archanges, valables chaque année (MM-JJ).
"""
import datetime
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENU = os.path.join(HERE, "..", "contenu", "2027")


def _charger(nom: str) -> dict:
    with open(os.path.join(CONTENU, nom), encoding="utf-8") as f:
        return json.load(f)


JOURS = _charger("jours_naissance.json")["jours"]
MEDJI = {m["numero"]: m for m in _charger("geomancie_medji.json")["signes_medji"]}
PERIODES = _charger("geomancie_periodes.json")["signes_medji"]
ANGES = _charger("anges_2027.json")["anges"]

JOURS_CLES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
ORDRE_FAITS = [
    "caractere_et_qualites",
    "amour_et_union",
    "famille_et_descendance",
    "reussite_et_vie_sociale",
    "sante_et_longevite",
    "epreuves_et_evenements",
]
MAITRES = {11, 22, 33}


def reduire_nombre(n: int, garder_maitres: bool = True) -> int:
    while n > 9 and not (garder_maitres and n in MAITRES):
        n = sum(int(c) for c in str(n))
    return n


def calculer_chemin_de_vie(date_iso: str) -> int:
    chiffres = [int(c) for c in date_iso if c.isdigit()]
    return reduire_nombre(sum(chiffres), garder_maitres=True)


def _valeur(bloc):
    """Valeur d'un bloc {valeur | texte | reference, source}. None si absent."""
    if bloc is None:
        return None
    if isinstance(bloc, (str, list)):
        return bloc
    for cle in ("valeur", "texte", "reference"):
        if bloc.get(cle) is not None:
            return bloc[cle]
    return None


def _liste(v) -> list:
    if v is None:
        return []
    if isinstance(v, str):
        return [v]
    return [str(x) for x in v]


def _interdictions(bloc) -> list:
    """Gère les deux formes : liste directe, ou sous-listes (alimentaires, vestimentaires...)."""
    if not bloc:
        return []
    if bloc.get("valeur") is not None:
        return _liste(bloc["valeur"])
    out = []
    for cle, v in bloc.items():
        if cle != "source" and isinstance(v, list):
            out += _liste(v)
    return out


def _md(mois: int, jour: int) -> str:
    return f"{mois:02d}-{jour:02d}"


def _dans_periode(md: str, debut: str, fin: str) -> bool:
    if debut <= fin:
        return debut <= md <= fin
    return md >= debut or md <= fin  # période qui traverse le 31 décembre


def _periode_medji(mois: int, jour: int):
    md = _md(mois, jour)
    for signe in PERIODES:
        for p in signe["periodes"]:
            if _dans_periode(md, p["debut"], p["fin"]):
                return signe["numero"], p
    raise ValueError(f"Aucune période Mêdji pour {md}")


def _archange_periode(mois: int, jour: int):
    md = _md(mois, jour)
    for a in ANGES:
        if a["debut"][5:] <= md <= a["fin"][5:]:
            return {"nom": a["nom"], "debut": a["debut"][5:], "fin": a["fin"][5:]}
    return None


def _signe_medji(numero: str, periode: dict) -> dict:
    m = MEDJI[numero]
    faits = m["faits"]
    return {
        "numero": numero,
        "nom": m["nom"],
        "titre": m["titre"],
        "prophetie": " ".join(p for c in ORDRE_FAITS for p in faits.get(c, [])),
        "conseil_2027": m["conseil_2027"],
        "traits": faits.get("caractere_et_qualites", [])[:4],
        "mises_en_garde": faits.get("mises_en_garde", []),
        "faits": faits,
        "signe_periode": {"signe": periode["signe"], "moitie": periode["moitie"]},
    }


def determiner_medji(mois: int, jour: int) -> dict:
    """Signe Mêdji correspondant à un mois et un jour (sans année)."""
    numero, periode = _periode_medji(mois, jour)
    return _signe_medji(numero, periode)


def analyser_profil_spirituel(date_iso: str) -> dict:
    """Profil complet d'une date de naissance (ISO AAAA-MM-JJ)."""
    d = datetime.date.fromisoformat(date_iso)
    j = JOURS[JOURS_CLES[d.weekday()]]
    archange = j["archange"]
    psaume = j.get("psaume") or {}
    numero, periode = _periode_medji(d.month, d.day)
    return {
        "date_naissance": date_iso,
        "jour_semaine": j["jour"],
        "archange": archange["nom"],
        "archange_attribut": archange.get("attribut"),
        "archange_alias": archange.get("alias"),
        "archange_periode": _archange_periode(d.month, d.day),
        "planete_regente": _valeur(j.get("planete")),
        "divinite_protectrice": _valeur(j.get("divinite_protectrice")),
        "couleurs_chance": _liste(_valeur(j.get("couleurs"))),
        "animal_porte_bonheur": _valeur(j.get("animal_porte_bonheur")),
        "mots_cles": _liste(_valeur(j.get("mots_cles"))),
        "psaume": psaume.get("reference"),
        "oracle": _valeur(j.get("oracle")),
        "interdictions": _interdictions(j.get("interdictions")),
        "metiers_recommandes": _liste(_valeur(j.get("metiers_recommandes")))
        + _liste(_valeur(j.get("metiers_complement"))),
        "vigilances_sante": _valeur(j.get("precautions_sante")),
        "nature_et_vocation": _valeur(j.get("nature_et_vocation")),
        "jour_ideal_pour": _valeur(j.get("jour_ideal_pour")),
        "signe_medji": _signe_medji(numero, periode),
        "chemin_de_vie": calculer_chemin_de_vie(date_iso),
    }


if __name__ == "__main__":
    print(json.dumps(analyser_profil_spirituel("2002-07-05"), ensure_ascii=False, indent=2))
