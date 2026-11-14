#!/bin/bash
# ========================================================
# AIRFLOW CLIMATE SOLUTIONS - HOSTINGER PRODUCTION DEPLOYMENT
# Target Domain: https://hvac.aspirinovation.com
# Database: Hostinger MySQL (u713584878_HVAC)
# ========================================================

set -e

echo "🚀 [1/5] Starting Production Deployment for https://hvac.aspirinovation.com..."

# Check Node.js and NPM
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "📦 Runtime: Node $NODE_VERSION, NPM $NPM_VERSION"

# 1. Install production dependencies
echo "📥 [2/5] Installing dependencies..."
npm install --legacy-peer-deps

# 2. Build Frontend (Vite) and Server (esbuild)
echo "⚡ [3/5] Building client bundle & standalone server.js..."
npm run build

# 3. Run safe, non-destructive MySQL migrations
echo "🗄️ [4/5] Running safe schema migrations..."
if [ -n "$DB_PASSWORD" ]; then
  npm run migrate || echo "⚠️ Migration note: ensure DB host is reachable from this runtime or check credentials."
else
  echo "ℹ️ DB_PASSWORD not exported in shell session. Ensure DB_PASSWORD is set in Hostinger environment."
fi

# 4. Check outputs
if [ -f "server.js" ] && [ -d "dist" ]; then
  echo "✅ [5/5] Production assets verified successfully:"
  echo "  - Standalone server: ./server.js"
  echo "  - Built web client:  ./dist"
  echo "  - Production entry:  node server.js"
  echo "  - Production URL:    https://hvac.aspirinovation.com"
else
  echo "❌ Error: Build output missing server.js or dist/ folder."
  exit 1
fi

echo "🎉 Deployment build complete! Ready for Hostinger PM2/Node.js startup."
