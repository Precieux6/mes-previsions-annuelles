#!/usr/bin/env python3
"""Module d'analyse spirituelle, géomantique (Fâ - 16 Mêdji) et des jours de naissance.
Intègre les enseignements traditionnels de référence transmis par M. Tossou Valère.
"""
import json, os, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")

with open(os.path.join(ROOT, "contenu", "2027", "jours_naissance.json"), encoding="utf-8") as f:
    JOURS_DATA = json.load(f)["jours"]

with open(os.path.join(ROOT, "contenu", "2027", "geomancie_medji.json"), encoding="utf-8") as f:
    MEDJI_LIST = json.load(f)["signes_medji"]

MEDJI_BY_NUM = {m["numero"]: m for m in MEDJI_LIST}

JOURS_CLEFS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def reduire_nombre(n: int, garder_maitres: bool = True) -> int:
    maitres = {11, 22, 33}
    while n > 9 and not (garder_maitres and n in maitres):
        n = sum(int(c) for c in str(n))
    return n


def calculer_chemin_de_vie(date_iso: str) -> int:
    chiffres = [int(c) for c in date_iso if c.isdigit()]
    return reduire_nombre(sum(chiffres), garder_maitres=True)


def determiner_medji(mois: int, jour: int) -> dict:
    """Détermine le signe Mêdji du Fâ selon le mois et le jour."""
    # Bélier (21 mars – 19 avril)
    if (mois == 3 and jour >= 21) or (mois == 4 and jour <= 19):
        return MEDJI_BY_NUM["14"]  # Sete - Medji

    # Taureau (20 avril – 20 mai)
    if mois == 4 and jour >= 20:
        return MEDJI_BY_NUM["13"]  # Lete - Medji (15 premiers jours)
    if mois == 5 and jour <= 5:
        return MEDJI_BY_NUM["13"]
    if mois == 5 and 6 <= jour <= 20:
        return MEDJI_BY_NUM["09"]  # Guda - Medji (15 derniers jours)

    # Gémeaux (21 mai – 20 juin)
    if mois == 5 and jour >= 21:
        return MEDJI_BY_NUM["03"]  # Winlin - Medji (15 premiers jours)
    if mois == 6 and jour <= 5:
        return MEDJI_BY_NUM["03"]
    if mois == 6 and 6 <= jour <= 20:
        return MEDJI_BY_NUM["10"]  # Sa - Medji (15 derniers jours)

    # Cancer (21 juin – 22 juillet)
    if mois == 6 and jour >= 21:
        return MEDJI_BY_NUM["01"]  # Gbè - Medji (15 premiers jours)
    if mois == 7 and jour <= 6:
        return MEDJI_BY_NUM["01"]
    if mois == 7 and 7 <= jour <= 22:
        return MEDJI_BY_NUM["02"]  # Yèkou - Medji (15 derniers jours)

    # Lion (23 juillet – 22 août)
    if mois == 7 and jour >= 23:
        return MEDJI_BY_NUM["05"]  # Losso - Medji (15 premiers jours)
    if mois == 8 and jour <= 7:
        return MEDJI_BY_NUM["05"]
    if mois == 8 and 8 <= jour <= 22:
        return MEDJI_BY_NUM["06"]  # Winlin - Medji (Lion)

    # Vierge (23 août – 22 septembre)
    if (mois == 8 and jour >= 23) or (mois == 9 and jour <= 22):
        return MEDJI_BY_NUM["12"]  # Turukpen - Medji

    # Balance (23 septembre – 22 octobre)
    if (mois == 9 and jour >= 23) or (mois == 10 and jour <= 22):
        return MEDJI_BY_NUM["07"]  # Ablà - Medji

    # Scorpion (23 octobre – 21 novembre)
    if mois == 10 and jour >= 23:
        return MEDJI_BY_NUM["11"]  # Tula - Medji (15 premiers jours)
    if mois == 11 and jour <= 6:
        return MEDJI_BY_NUM["11"]
    if mois == 11 and 7 <= jour <= 21:
        return MEDJI_BY_NUM["09"]  # Guda - Medji (15 derniers jours)

    # Sagittaire (22 novembre – 21 décembre)
    if (mois == 11 and jour >= 22) or (mois == 12 and jour <= 21):
        return MEDJI_BY_NUM["16"]  # Fu - Medji

    # Capricorne (22 décembre – 19 janvier)
    if (mois == 12 and jour >= 22) or (mois == 1 and jour <= 19):
        return MEDJI_BY_NUM["04"]  # Di - Medji

    # Verseau (20 janvier – 18 février)
    if (mois == 1 and jour >= 20) or (mois == 2 and jour <= 18):
        return MEDJI_BY_NUM["08"]  # Aklan - Medji

    # Poissons (19 février – 20 mars)
    return MEDJI_BY_NUM["15"]  # Ka - Medji


def analyser_profil_spirituel(date_iso: str) -> dict:
    """Analyse complète d'une date de naissance (ISO AAAA-MM-JJ)."""
    d = datetime.date.fromisoformat(date_iso)
    jour_idx = d.weekday()  # 0: lundi ... 6: dimanche
    cle_jour = JOURS_CLEFS[jour_idx]
    infos_jour = JOURS_DATA[cle_jour]

    medji = determiner_medji(d.month, d.day)
    chemin_de_vie = calculer_chemin_de_vie(date_iso)

    return {
        "date_naissance": date_iso,
        "jour_semaine": infos_jour["jour"],
        "archange": infos_jour["archange"],
        "archange_attribut": infos_jour["archange_attribut"],
        "planete_regente": infos_jour["planete"],
        "divinite_protectrice": infos_jour["divinite_protectrice"],
        "couleurs_chance": infos_jour["couleurs"],
        "animal_porte_bonheur": infos_jour["animal_porte_bonheur"],
        "mots_cles": infos_jour["mots_cles"],
        "psaume": infos_jour["psaume"],
        "interdictions": infos_jour["interdictions"],
        "metiers_recommandes": infos_jour["metiers_recommandes"],
        "vigilances_sante": infos_jour["vigilances_sante"],
        "signe_medji": {
            "numero": medji["numero"],
            "nom": medji["nom"],
            "titre": medji["titre"],
            "prophetie": medji["prophetie"],
            "conseil_2027": medji["conseil_2027"],
            "traits": medji["traits"]
        },
        "chemin_de_vie": chemin_de_vie
    }


if __name__ == "__main__":
    test = analyser_profil_spirituel("2002-07-05")
    print(json.dumps(test, ensure_ascii=False, indent=2))
