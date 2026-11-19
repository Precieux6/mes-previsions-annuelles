#!/usr/bin/env bash
# Installation initiale sur la machine Oracle (Ubuntu). À lancer une seule fois.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y ca-certificates curl git

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"

# Dossier des variables d'environnement, hors du dépôt
sudo mkdir -p /etc/mes-previsions
sudo touch /etc/mes-previsions/worker.env
sudo chown "$USER":"$USER" /etc/mes-previsions/worker.env
sudo chmod 600 /etc/mes-previsions/worker.env

echo "Installation terminée."
echo "1. Déconnectez-vous puis reconnectez-vous en SSH (pour le groupe docker)."
echo "2. Renseignez /etc/mes-previsions/worker.env (voir deploy/worker.env.example)."
