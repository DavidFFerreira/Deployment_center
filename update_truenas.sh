#!/bin/bash
set -e

REPO_DIR="/mnt/Disco1/apps/deployment-center"
GITHUB_TOKEN="${1:-}"

echo "?? A atualizar o Universal Deployment Center no TrueNAS..."

if [ ! -d "$REPO_DIR" ]; then
  mkdir -p "$REPO_DIR"
  cd "$REPO_DIR"
  git clone "https://${GITHUB_TOKEN}@github.com/DavidFFerreira/Deployment_center.git" .
else
  cd "$REPO_DIR"
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/DavidFFerreira/Deployment_center.git"
  git fetch origin
  git reset --hard origin/main
fi

docker compose up -d --build

echo "? Universal Deployment Center atualizado e ativo em http://192.168.1.4:50000!"

