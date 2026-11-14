# Production Deployment & Hostinger MySQL Integration Guide

**Production Subdomain:** `https://hvac.aspirinovation.com`  
**Application:** High-Conversion HVAC SaaS & Multi-Tenant Digital Platform  
**Database:** Hostinger Managed MySQL 8.0  
**Backend:** Node.js Express API + Connection Pool (`mysql2`)  
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS  

---

## 1. Architectural Overview

The HVAC Platform combines a high-performance React frontend with an Express API backend backed by Hostinger MySQL as the authoritative persistent data store.

### Key Database Components:
- **Hostinger MySQL Host**: `srv537.hstgr.io` (IP: `195.35.61.115`, Port: `3306`)
- **Local Hostname on Hostinger Server**: `127.0.0.1` or `localhost` (when running inside the same container)
- **Database Name**: `u713584878_HVAC`
- **Database User**: `u713584878_hvacuser`
- **Connection Module**: `/server/mysql.ts` with automatic reconnection, keep-alives, connection pool (`mysql2/promise`), connection limit (10), query timeouts (10s), and health monitoring.
- **Repository Layer**: `/server/mysql-repository.ts` using strictly parameterized queries (`?`) to prevent SQL injection.
- **Schema Migrations**: Version-controlled migrations in `/database/migrations/001_initial_schema.sql` tracked in the `schema_migrations` table.

---

## 2. Hostinger Environment Variables

In your Hostinger hPanel under **Node.js** -> **Environment Variables**, set:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://hvac.aspirinovation.com

# Database Configuration
DB_HOST=srv537.hstgr.io
DB_PORT=3306
DB_NAME=u713584878_HVAC
DB_USER=u713584878_hvacuser
DB_PASSWORD=vXXc0wyw8*Av
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT_MS=8000

# Security (Set strong random keys in production)
ADMIN_TOKEN=hvac-admin-supersecret-token
SUPER_ADMIN_TOKEN=hvac-super-admin-root-key
DISPATCHER_TOKEN=hvac-dispatch-verified-token
```

> **Note on `DB_HOST`:**  
> When deploying your Node.js application directly inside Hostinger's hosting environment on the same account as the database, you can use `127.0.0.1` or `localhost` for sub-millisecond local Unix/TCP performance. When connecting remotely (such as during external development, staging, or GitHub CI), use `srv537.hstgr.io`.

---

## 3. GitHub Synchronization & Hostinger Git Deployment

### Step A: Push to GitHub Repository
1. Commit all project files to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: Hostinger MySQL integration and deployment readiness"
   git push origin main
   ```
2. Verify that `.env` is **never** committed (enforced by `.gitignore`), while `.env.example` remains tracked as a reference.

### Step B: Configure Hostinger Git Deployment
1. Log in to **Hostinger hPanel**.
2. Select your domain/subdomain: `hvac.aspirinovation.com`.
3. Navigate to **Advanced** -> **Git**.
4. Create a new repository link:
   - **Repository URL**: `https://github.com/your-username/your-hvac-repo.git`
   - **Branch**: `main`
   - **Install Path**: `/public_html` (or your subdomain directory `domains/aspirinovation.com/public_html/hvac`)
5. Enable **Auto-Deployment** via the GitHub Webhook provided by Hostinger.

---

## 4. Hostinger Node.js Application Setup

In **Hostinger hPanel** -> **Websites** -> **Manage** -> **Node.js**:

1. **Node.js version**: Select `20.x` or `22.x` (LTS recommended).
2. **Application mode**: `Production`.
3. **Application root**: Path to the repository files (e.g. `domains/aspirinovation.com/public_html/hvac`).
4. **Application startup file**: `server.ts` (using `tsx`) or `dist-server/server.js` (compiled).
5. **Install Dependencies**:
   Click **NPM Install** or run via SSH:
   ```bash
   npm install --production=false
   ```
6. **Run Schema Migrations**:
   Run the automated database migration script to ensure all 30 tables are up to date:
   ```bash
   npm run migrate
   ```
7. **Seed Initial Data (First Deployment Only)**:
   ```bash
   npm run seed
   ```
8. **Build the Application**:
   ```bash
   npm run build
   ```
9. **Start the Dev/Production Server**:
   Click **Start Application** or run:
   ```bash
   npm start
   ```

---

## 5. SSL & Domain Verification for `hvac.aspirinovation.com`

1. In Hostinger hPanel, go to **Domains** -> **Subdomains**.
2. Ensure `hvac.aspirinovation.com` is pointed to the Node.js application directory.
3. In **SSL**, ensure **Lifetime Free SSL (Let's Encrypt)** is active and forced HTTPS is toggled **ON**.
4. Test HTTPS resolution:
   ```bash
   curl -I https://hvac.aspirinovation.com
   ```

---

## 6. Real-Time Verification Endpoints

Your application provides live monitoring endpoints to verify the Hostinger MySQL connection and backend uptime:

- **System Health Check**:
  `GET https://hvac.aspirinovation.com/api/health`
  Returns:
  ```json
  {
    "status": "healthy",
    "app": "HVAC Platform Engine",
    "version": "2.0.0",
    "environment": "production",
    "productionDomain": "https://hvac.aspirinovation.com",
    "database": {
      "engine": "MySQL 8.0 (Hostinger Cloud)",
      "connected": true,
      "latencyMs": 42,
      "hydrated": true,
      "activePool": true,
      "configuredHost": "srv537.hstgr.io",
      "databaseName": "u713584878_HVAC"
    },
    "uptimeSeconds": 1420
  }
  ```

- **Detailed Database Diagnostics**:
  `GET https://hvac.aspirinovation.com/api/database/status`
  Verifies TCP handshake, active pool state, and credentials.

---

## 7. Migration & Backup Policy

- **Automated Migration Runner**: Every migration in `database/migrations/*.sql` is idempotent and tracked in `schema_migrations`.
- **Zero-Loss Rollbacks**: Tables are never dropped or truncated during normal application startup.
- **Backups in Hostinger**: Under Hostinger hPanel -> **Databases** -> **phpMyAdmin** or **Database Backups**, click **Generate Backup** before applying major schema revisions.
