#!/usr/bin/env python3
"""Contrôle des données spirituelles 2027.

Vérifie : noms Mêdji (PDF de référence), couverture exacte des périodes Mêdji sur 365 jours,
couverture des périodes d'archanges, présence des sept jours, correspondance des textes
d'année universelle, et limite de phrases de la révélation. Code de sortie 1 si erreur.
"""
import datetime, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENU = os.path.join(HERE, "..", "contenu", "2027")
NOMS_REFERENCE = {
    "01": "Gbè - Medji", "02": "Yèkou - Medji", "03": "Woli - Medji", "04": "Di - Medji",
    "05": "Losso - Medji", "06": "Winlin - Medji", "07": "Abla - Medji", "08": "Aklan - Medji",
    "09": "Guda - Medji", "10": "Sa - Medji", "11": "Ka - Medji", "12": "Troukpin - Medji",
    "13": "Tula - Medji", "14": "Lete - Medji", "15": "Tchè - Medji", "16": "Fu - Medji",
}
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def charger(nom):
    with open(os.path.join(CONTENU, nom), encoding="utf-8") as f:
        return json.load(f)


def dans_periode(md, debut, fin):
    return (debut <= md <= fin) if debut <= fin else (md >= debut or md <= fin)


def main():
    erreurs = []
    medji = charger("geomancie_medji.json")["signes_medji"]
    periodes = charger("geomancie_periodes.json")["signes_medji"]
    jours = charger("jours_naissance.json")["jours"]
    anges = charger("anges_2027.json")["anges"]
    annee = charger("annee_universelle.json")
    revelation = charger("revelation.json")

    # 1. Noms Mêdji : identiques dans les deux fichiers et conformes au PDF de référence.
    noms_medji = {m["numero"]: m["nom"] for m in medji}
    noms_periodes = {p["numero"]: p["nom"] for p in periodes}
    for num, nom_ref in NOMS_REFERENCE.items():
        if noms_medji.get(num) != nom_ref:
            erreurs.append(f"geomancie_medji.json : n°{num} = {noms_medji.get(num)!r}, attendu {nom_ref!r}")
        if noms_periodes.get(num) != nom_ref:
            erreurs.append(f"geomancie_periodes.json : n°{num} = {noms_periodes.get(num)!r}, attendu {nom_ref!r}")

    # 2. Périodes Mêdji : chaque jour de 2027 appartient à exactement une période.
    jour = datetime.date(2027, 1, 1)
    while jour.year == 2027:
        md = jour.strftime("%m-%d")
        trouves = [s["numero"] for s in periodes for p in s["periodes"] if dans_periode(md, p["debut"], p["fin"])]
        if len(trouves) != 1:
            erreurs.append(f"Période Mêdji : {md} couvert {len(trouves)} fois ({trouves})")
        jour += datetime.timedelta(days=1)

    # 3. Périodes d'archanges : couverture de 2027 sans trou ni chevauchement.
    couvert = {}
    for a in anges:
        d = datetime.date.fromisoformat(a["debut"])
        fin = datetime.date.fromisoformat(a["fin"])
        while d <= fin:
            couvert[d] = couvert.get(d, 0) + 1
            d += datetime.timedelta(days=1)
    for d in (datetime.date(2027, 1, 1) + datetime.timedelta(days=i) for i in range(365)):
        n = couvert.get(d, 0)
        if n != 1:
            erreurs.append(f"Archanges : {d.isoformat()} couvert {n} fois")

    # 4. Les sept jours existent, avec un archange.
    for cle in JOURS:
        if cle not in jours or not jours[cle].get("archange", {}).get("nom"):
            erreurs.append(f"jours_naissance.json : jour ou archange manquant : {cle}")

    # 5. Année universelle : les textes du bloc révélation sont ceux de annee_universelle.json.
    bloc = next((b for b in revelation["plan"] if b["bloc"] == "annee_universelle"), None)
    if bloc is None:
        erreurs.append("revelation.json : bloc annee_universelle absent")
    else:
        for cle in ("maitre", "reduit"):
            if bloc["phrases"].get(cle) != annee["lectures"][cle]["texte"]:
                erreurs.append(f"Année universelle : texte « {cle} » différent entre revelation.json et annee_universelle.json")

    # 6. Limite de phrases de la révélation : un bloc par élément, 8 phrases au maximum (pire cas : date fournie).
    pire_cas = 0
    for b in revelation["plan"]:
        pire_cas += len(b["phrases"]) if isinstance(b["phrases"], list) else (2 if b["bloc"] == "annee_universelle" else 1)
    if pire_cas > revelation["phrases_max"]:
        erreurs.append(f"Révélation : {pire_cas} phrases possibles, maximum {revelation['phrases_max']}")

    for e in erreurs:
        print("ERREUR :", e)
    print(f"Contrôle spirituel 2027 : {len(erreurs)} erreur(s).")
    return 1 if erreurs else 0


if __name__ == "__main__":
    sys.exit(main())
