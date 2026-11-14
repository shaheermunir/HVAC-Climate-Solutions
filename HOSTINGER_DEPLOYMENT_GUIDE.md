# Hostinger Production Deployment Guide
**Target Production Domain:** `https://hvac.aspirinovation.com`  
**Database:** Hostinger MySQL (`u713584878_HVAC`)

---

## 1. Production Architecture Overview

The application is structured as a high-performance, single-instance full-stack service:
- **Frontend:** React 19 SPA built via Vite into `dist/` with immutable asset caching (`1y` cache-control) and instantaneous client-side navigation.
- **Backend:** Express API compiled into a standalone bundle `server.js` with parameter-safe SQL queries, security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, `Strict-Transport-Security`), in-memory submission rate limiting, and graceful termination.
- **Database:** Hostinger MySQL with connection pooling (`mysql2/promise`), connection timeout guards, transient error recovery, and automatic fallback persistence.
- **Content Management:** All Pages Content Studio & Live Editor Toolbar with role-based access for Super Admin (`super_admin`) and Business Admin (`business_admin`).

---

## 2. Hostinger hPanel Configuration Steps

### Step A: Subdomain & DNS Setup
1. In Hostinger hPanel, go to **Domains > Subdomains**.
2. Add subdomain `hvac` under `aspirinovation.com`.
3. Target document root: `public_html/hvac` (or your chosen directory).
4. Verify DNS points to your Hostinger server IP (`195.35.61.115`).
5. In **Security > SSL**, activate a free **Let's Encrypt SSL Certificate** for `hvac.aspirinovation.com` to enforce HTTPS.

### Step B: Hostinger MySQL Database Verification
1. Open **Databases > Management** in hPanel.
2. Confirm the database exists:
   - Database Name: `u713584878_HVAC`
   - Database Username: `u713584878_hvacuser`
   - Port: `3306`
3. **Database Host Selection:**
   - If running the Node.js application **on the same Hostinger server** (recommended), use `DB_HOST=127.0.0.1` or `localhost`.
   - If connecting remotely or from an external container, use `DB_HOST=srv537.hstgr.io` (or `195.35.61.115`) and make sure to add your IP under **Remote MySQL** in hPanel.

### Step C: Node.js Application Setup in hPanel
1. In Hostinger hPanel, search for **Node.js** or go to **Advanced > Node.js**.
2. Click **Create Application**:
   - **Node.js Version:** `18.x` or `20.x` LTS
   - **Application Mode:** `Production`
   - **Application Root:** `/home/u713584878/domains/aspirinovation.com/public_html/hvac` (or your cloned repo root)
   - **Application Startup File:** `server.js`
   - **Application URL:** `https://hvac.aspirinovation.com`
3. Click **Create**.

### Step D: Environment Variables (Hostinger Environment Manager)
Under the Node.js application settings in hPanel, add these environment variables:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables optimized production asset serving & security |
| `APP_URL` | `https://hvac.aspirinovation.com` | Base URL for sitemap, robots, and canonical links |
| `PORT` | `3000` (or assigned by Hostinger) | Server listening port |
| `DB_HOST` | `127.0.0.1` (or `srv537.hstgr.io`) | MySQL database host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `u713584878_HVAC` | Database name |
| `DB_USER` | `u713584878_hvacuser` | Database user |
| `DB_PASSWORD` | `vXXc0wyw8*Av` | Database password |
| `DB_CONNECTION_LIMIT` | `10` | Appropriate connection pool limit |
| `ADMIN_SESSION_SECRET`| *(random 32-character string)* | Session signing key |

---

## 3. Deployment & Build Commands

Connect via Hostinger SSH or the built-in Terminal:

```bash
# 1. Pull the latest commits from your GitHub repository
git pull origin main

# 2. Run the deployment script (or execute individual steps below)
./deploy.sh
```

Or run manually:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build client distribution and server bundle
npm run build

# Run database schema migrations (creates all 26+ tables including site_pages)
npm run migrate

# Restart the application
# If using Hostinger Node.js GUI: Click "Restart Application" button
# If using PM2 directly:
pm2 start ecosystem.config.cjs --env production
# or
pm2 restart hvac-production-app
```

---

## 4. Production Health Verification

Once started, test these endpoints:

1. **System Health & MySQL Diagnostics:**
   ```bash
   curl -I https://hvac.aspirinovation.com/api/health
   ```
   Expected response: `HTTP 200 OK` with JSON status `"healthy"` and database connected.

2. **Sitemap & Robots Verification:**
   - `https://hvac.aspirinovation.com/robots.txt`
   - `https://hvac.aspirinovation.com/sitemap.xml`

3. **Admin Studio & Security:**
   - Visit `https://hvac.aspirinovation.com/admin` to log into the Master Admin Studio.
   - Live visual editing toolbar is available for `super_admin` and `business_admin` directly on the live website.
