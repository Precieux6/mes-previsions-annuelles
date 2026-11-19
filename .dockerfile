# Worker « Mes prévisions annuelles » — Hugging Face Spaces (SDK Docker)
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 chromium ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Piper : moteur de synthèse vocale (vérifier la version sur la page des releases)
ARG PIPER_VERSION=2023.11.14-2
RUN curl -fsSL -o /tmp/piper.tar.gz \
      https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_x86_64.tar.gz \
    && tar -xzf /tmp/piper.tar.gz -C /opt \
    && rm /tmp/piper.tar.gz

# Voix française (modèle ONNX + configuration)
RUN mkdir -p /app/models \
    && curl -fsSL -o /app/models/fr_FR-siwis-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx \
    && curl -fsSL -o /app/models/fr_FR-siwis-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json

# Hugging Face attend une application qui écoute sur le port 7860 et tourne avec un utilisateur non root
RUN useradd -m -u 1000 user
ENV PIPER_BIN=/opt/piper/piper \
    PIPER_MODEL_PATH=/app/models/fr_FR-siwis-medium.onnx \
    PYTHON_BIN=python3 \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=7860

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN chown -R user:user /app

USER user
EXPOSE 7860
CMD ["npx", "tsx", "worker/index.ts"]
