#!/usr/bin/env python3
"""Révélation annuelle individuelle : assemble les blocs du plan contenu/2027/revelation.json.

Entrée : nombres issus du nom (expression, âme), année personnelle (ou universelle réduite),
élément solaire si date fournie, et année universelle en double lecture {maitre, reduit}.
Sortie : liste de phrases, 8 au maximum, dans l'ordre du plan.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PLAN = json.load(open(os.path.join(HERE, "..", "contenu", "2027", "revelation.json"), encoding="utf-8"))


def revelation(annee_cycle: int, expression: int, ame: int, element_solaire: str | None,
               universelle: dict | None = None) -> list[str]:
    sortie = []
    for bloc in PLAN["plan"]:
        b = bloc["bloc"]
        if b == "intro":
            sortie.append(bloc["phrases"][0])
        elif b == "cycle":
            sortie.append(bloc["phrases"][str(annee_cycle)])
        elif b == "expression":
            sortie.append(bloc["phrases"][str(expression)])
        elif b == "ame":
            sortie.append(bloc["phrases"][str(ame)])
        elif b == "element_solaire":
            if element_solaire:
                sortie.append(bloc["phrases"][element_solaire.lower()])
        elif b == "annee_universelle":
            # Double portée : une phrase pour le nombre maître, une pour la réduction.
            if universelle:
                sortie.append(bloc["phrases"]["maitre"])
                sortie.append(bloc["phrases"]["reduit"])
        elif b == "cloture":
            sortie.append(bloc["phrases"][0])
    return sortie[: PLAN["phrases_max"]]


if __name__ == "__main__":
    print(json.dumps(revelation(2, 9, 4, "terre", {"maitre": 11, "reduit": 2}), ensure_ascii=False, indent=2))
