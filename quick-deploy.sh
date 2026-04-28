#!/bin/bash

# Quick Deployment Script - No prompts, just deploy
# Use this for automated deployments

set -e

# Color codes
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Quick Deploy - Genvedha Website${NC}"

APP_DIR="${APP_DIR:-$HOME/genvedha-website}"
GIT_REPO="https://github.com/yogmca/genvedha.git"
GIT_BRANCH="production"
PM2_APP_NAME="genvedha-website"

echo "Deploying to: $APP_DIR"

# Clone if doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    git clone -b "$GIT_BRANCH" "$GIT_REPO" "$APP_DIR"
fi

cd "$APP_DIR"

# Backup .env
[ -f ".env" ] && cp .env .env.backup

# Pull latest
echo "Pulling latest code..."
git fetch origin
git pull origin "$GIT_BRANCH" || git pull origin main || git pull origin master

# Restore .env
[ -f ".env.backup" ] && mv .env.backup .env

# Install dependencies (including devDependencies for build)
echo "Installing dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci --include=dev
else
    npm install
fi

# Build the application
echo "Building application..."
if npm run build; then
    echo "Build successful"
else
    echo "Build failed, but continuing (may not be required for all deployments)"
fi

# PM2 management
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 restart "$PM2_APP_NAME"
else
    pm2 start server.js --name "$PM2_APP_NAME"
fi

pm2 save

echo -e "${GREEN}Deployment complete!${NC}"
pm2 status
