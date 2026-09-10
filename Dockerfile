FROM node:20-bookworm-slim

WORKDIR /app

# Instalar git, curl, ca-certificates, zip, unzip, docker CLI e docker-compose v2 oficial
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    curl \
    zip \
    unzip \
    docker.io \
    && mkdir -p /usr/local/lib/docker/cli-plugins /root/.docker/cli-plugins \
    && curl -SL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && ln -sf /usr/local/bin/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose \
    && ln -sf /usr/local/bin/docker-compose /root/.docker/cli-plugins/docker-compose \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --production

COPY . ./

# Impedir a publicação de uma imagem com erros no template de provisionamento.
RUN npm run build

EXPOSE 50000

ENV PORT=50000
ENV NODE_ENV=production

CMD ["node", "server.js"]

