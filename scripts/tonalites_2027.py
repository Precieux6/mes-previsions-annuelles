#!/usr/bin/env python3
"""Tonalités : classement des fragments par registre, et correspondance avec les nombres personnels 1 à 9.

Le registre associé à chaque nombre suit les thèmes des neuf cycles numérologiques
(année personnelle et mois personnel). Un fragment peut porter plusieurs registres.
"""
import re, unicodedata

REGISTRES = ["initiative", "coop", "expression", "structure", "changement", "foyer", "introspection", "realisation", "achevement"]
NOMBRE_VERS_REGISTRE = {1: "initiative", 2: "coop", 3: "expression", 4: "structure", 5: "changement",
                        6: "foyer", 7: "introspection", 8: "realisation", 9: "achevement"}
MOTS = {
    "initiative": r"lanc|initiat|premier pas|nouveau depart|oser|proposer|autonom|prendre les devants|se lancer|poser une intention",
    "coop": r"patien|ecoute|cooperat|partenariat|accord|equilibr|complic|ensemble|confiance|compromis|alliance",
    "expression": r"expri|creat|parole|idee|jeu|joie|ecrire|partag|rire|fete|talent|present",
    "structure": r"methode|organis|rigueur|structur|planning|routine|budget|document|regle|calendrier|priorit|tableau|liste",
    "changement": r"changement|mouvement|voyage|imprevu|decouvert|adapt|nouveaut|bouger|ouverture|transition",
    "foyer": r"foyer|famille|maison|proch|responsab|soin|aines|enfant|repas|logement",
    "introspection": r"reflexion|interiorit|etude|silence|repos|apprentissage|formation|calme|meditation|recul|intuition",
    "realisation": r"realis|resultat|reconnaiss|objectif|ambition|autorit|mise en valeur|chiffr|reussite|negoci",
    "achevement": r"bilan|achev|clore|cloture|tri|fin de|terminer|ranger|faire le point|archiv|solder|conclure",
}

def norm(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()

def registres_du_texte(texte):
    n = norm(texte)
    return [r for r in REGISTRES if re.search(MOTS[r], n)]

def registre_du_nombre(n):
    return NOMBRE_VERS_REGISTRE[n]
