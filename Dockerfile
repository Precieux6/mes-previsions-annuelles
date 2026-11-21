FROM node:20-bookworm-slim

# Installation des dépendances système (Python 3, Chromium et bibliothèques requises par Puppeteer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    chromium \
    ca-certificates \
    curl \
    tar \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Installation du binaire Piper TTS (synthèse vocale locale)
RUN mkdir -p /opt/piper \
    && curl -sL https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz | tar -xz -C /opt/piper --strip-components=1 \
    && chmod +x /opt/piper/piper

# Téléchargement du modèle de voix française (siwis-medium)
RUN mkdir -p /app/models \
    && curl -sL https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx -o /app/models/fr_FR-siwis-medium.onnx \
    && curl -sL https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json -o /app/models/fr_FR-siwis-medium.onnx.json

WORKDIR /app

# Variables d'environnement par défaut dans le conteneur
ENV CHROME_PATH=/usr/bin/chromium
ENV PIPER_BIN=/opt/piper/piper
ENV PIPER_MODEL_PATH=/app/models/fr_FR-siwis-medium.onnx
ENV PYTHON_BIN=python3
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Installation des dépendances Node.js
COPY package*.json ./
RUN npm install

# Copie de l'ensemble du projet
COPY . .

# Lancement du worker en écoute continue
CMD ["npm", "run", "worker"]
