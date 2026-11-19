# Worker « Mes prévisions annuelles » : Node, Python, Chromium et Piper.
# Compatible x86_64 et aarch64 (Oracle Cloud Ampere).
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 chromium ca-certificates curl tar \
    && rm -rf /var/lib/apt/lists/*

# Piper : moteur de synthèse vocale, version à confirmer sur la page des releases.
ARG PIPER_VERSION=2023.11.14-2
RUN set -eux; \
    arch="$(uname -m)"; \
    case "$arch" in \
      x86_64)  pa=x86_64 ;; \
      aarch64) pa=aarch64 ;; \
      *) echo "Architecture non prise en charge : $arch"; exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/piper.tar.gz \
      "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_${pa}.tar.gz"; \
    tar -xzf /tmp/piper.tar.gz -C /opt; \
    rm /tmp/piper.tar.gz; \
    chmod +x /opt/piper/piper

# Voix française (modèle ONNX et configuration).
RUN mkdir -p /app/models \
    && curl -fsSL -o /app/models/fr_FR-siwis-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx \
    && curl -fsSL -o /app/models/fr_FR-siwis-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json

ENV PIPER_BIN=/opt/piper/piper \
    PIPER_MODEL_PATH=/app/models/fr_FR-siwis-medium.onnx \
    PYTHON_BIN=python3 \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npx", "tsx", "worker/index.ts"]
