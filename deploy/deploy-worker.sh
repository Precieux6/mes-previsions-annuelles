#!/usr/bin/env bash
# Mise à jour et redémarrage du worker. À relancer à chaque modification du code.
set -euo pipefail

APP_DIR="$HOME/mes-previsions-annuelles"
ENV_FILE=/etc/mes-previsions/worker.env
NOM=mes-previsions-worker

cd "$APP_DIR"
git pull --ff-only
docker build -t "$NOM:latest" .
docker rm -f "$NOM" 2>/dev/null || true
docker run -d \
  --name "$NOM" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  --shm-size=1g \
  "$NOM:latest"

sleep 5
docker logs --tail 30 "$NOM"
