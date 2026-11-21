#!/usr/bin/env python3
"""Mise à jour des fichiers de validation 2027, sans toucher aux textes validés.

- validations/relecture_2027.json : remplace le champ « reserve » (signature non requise).
- validations/relecture_annuel_2027.json : ajoute les deux textes de l'année universelle,
  dans « textes » et dans « entrees », sans doublon. Les textes sont lus depuis
  contenu/2027/annee_universelle.json, à l'identique.

Idempotent : relancer le script ne modifie rien si les changements sont déjà faits.
Usage : python3 scripts/maj_validations_2027.py [--dry-run]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
VALIDATIONS = os.path.join(HERE, "..", "validations")
ANNEE_UNIVERSELLE = os.path.join(HERE, "..", "contenu", "2027", "annee_universelle.json")

RESERVE = ("Signature de M. Folly Valère Tossou non requise : la base de données produit une "
           "analyse personnalisée. La validation des contenus repose sur les champs approuve "
           "et approuve_par.")


def charger(chemin):
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def ecrire(chemin, donnees):
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(donnees, f, ensure_ascii=False, indent=2)
        f.write("\n")


def mettre_a_jour_relecture_2027(dry_run):
    chemin = os.path.join(VALIDATIONS, "relecture_2027.json")
    donnees = charger(chemin)
    if donnees.get("approuve") is not True:
        sys.exit("relecture_2027.json : approuve n'est pas true. Arrêt.")
    if donnees.get("reserve") == RESERVE:
        print("relecture_2027.json : déjà à jour.")
        return False
    donnees["reserve"] = RESERVE
    print(f"relecture_2027.json : champ reserve mis à jour ({len(donnees['textes'])} textes conservés).")
    if len(donnees["textes"]) != donnees.get("nb_fragments"):
        print(f"  Attention : {len(donnees['textes'])} textes, nb_fragments indique {donnees.get('nb_fragments')}.")
    if not dry_run:
        ecrire(chemin, donnees)
    return True


def mettre_a_jour_relecture_annuel(dry_run):
    chemin = os.path.join(VALIDATIONS, "relecture_annuel_2027.json")
    donnees = charger(chemin)
    lectures = charger(ANNEE_UNIVERSELLE)["lectures"]
    modifie = False

    for cle in ("maitre", "reduit"):
        texte = lectures[cle]["texte"]
        if texte not in donnees["textes"]:
            donnees["textes"].append(texte)
            modifie = True
        deja = [e for e in donnees["entrees"]
                if e.get("bloc") == "annee_universelle" and e.get("cle") == cle]
        if not deja:
            donnees["entrees"].append({"type": "revelation", "bloc": "annee_universelle",
                                       "cle": cle, "texte": texte})
            modifie = True
        elif deja[0].get("texte") != texte:
            sys.exit(f"relecture_annuel_2027.json : entrée annee_universelle/{cle} différente. "
                     "Corriger à la main avant de relancer.")
    if donnees.get("reserve") != RESERVE:
        donnees["reserve"] = RESERVE
        modifie = True
      
    if "nb_textes" in donnees and donnees["nb_textes"] != len(donnees["textes"]):
        donnees["nb_textes"] = len(donnees["textes"])
        modifie = True
    if not modifie:
        print("relecture_annuel_2027.json : déjà à jour.")
        return False
    print(f"relecture_annuel_2027.json : textes et entrées annee_universelle ajoutés "
          f"({len(donnees['textes'])} textes au total).")
    if not dry_run:
        ecrire(chemin, donnees)
    return True


def main():
    dry_run = "--dry-run" in sys.argv
    modifies = [
        mettre_a_jour_relecture_2027(dry_run),
        mettre_a_jour_relecture_annuel(dry_run),
    ]
    if dry_run:
        print("Mode simulation : aucun fichier écrit.")
    elif any(modifies):
        print("Fichiers écrits.")
    else:
        print("Aucune modification nécessaire.")


if __name__ == "__main__":
    main()
