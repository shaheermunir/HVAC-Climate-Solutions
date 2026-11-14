# Airflow Climate Solutions – HVAC Platform & Lead Generation Engine

A complete, production-grade HVAC business website, online scheduling engine, customer portal, and administrative dispatch platform built for United States heating and air conditioning contractors.

---

## 1. Feature Implementation Register

| Section / Capability | Implementation Status | Notes |
| :--- | :--- | :--- |
| **Centralized Business Configuration** | **Implemented & Tested** | Configurable via Admin Wizard (`/admin`) without touching code |
| **Brand Strategy & Design System** | **Implemented & Tested** | Refined Deep Navy palette, 60-30-10 discipline, zero-pill metadata |
| **Top Bar Contract & Header** | **Implemented & Tested** | 3-zone contract, 24/7 emergency dispatch strip, mobile drawer |
| **Public Information Architecture (42+ routes)** | **Implemented & Tested** | Full client-side routing & page registry covering all services and areas |
| **Service Catalog & Detail Pages** | **Implemented & Tested** | 17+ services with symptoms, process phases, equipment, and pricing |
| **Customer Journey A: Emergency Triage** | **Implemented & Tested** | 24/7 triage form, photo upload preview, 2-hour dispatch disclosure |
| **Customer Journey B: Routine Online Booking** | **Implemented & Tested** | Concurrency-safe slot reservations, capacity limits, .ics calendar export |
| **Customer Journey C: System Sizing Calculator** | **Implemented & Tested** | ACCA Manual J load approximation, tonnage, BTUs, and energy savings |
| **Customer Journey D: Comfort Club Memberships** | **Implemented & Tested** | Silver, Gold, Platinum plans, annual/monthly billing, instant enrollment |
| **Financing & Incentives Center** | **Implemented & Tested** | Loan payment estimator, Wells Fargo/Synchrony/GoodLeap info, IRA 25C |
| **Trust, Reviews & Moderation** | **Implemented & Tested** | Verified customer reviews, rating breakdown, public submission form |
| **Guarantees & Warranties** | **Implemented & Tested** | 100% Satisfaction, 10-Yr Parts, 2-Yr Craftsmanship, No-Lemon guarantee |
| **Local SEO & ZIP Code Directory** | **Implemented & Tested** | Dynamic XML sitemap, robots.txt, Schema.org HVACBusiness JSON-LD |
| **Educational Resource Center & Blog** | **Implemented & Tested** | Technician-authored troubleshooting guides with safety warnings |
| **Project Portfolio & Case Studies** | **Implemented & Tested** | Documented installations with real equipment specs and measured outcomes |
| **Customer Portal** | **Implemented & Tested** | Equipment inventory, appointment status, 1-click e-signature approvals |
| **Admin Control Panel & CRM** | **Implemented & Tested** | Executive KPIs, Leads Kanban/table, CSV export, Services CMS |
| **Field Dispatch & Technicians** | **Implemented & Tested** | Technician assignments, capacity validation, daily roster status |
| **AI Climate Assistant** | **Implemented & Tested** | Server-side Gemini 3.8 Flash (`@google/genai`) with safety guardrails |
| **Automated Test Suite** | **Implemented & Tested** | 9 unit & integration tests (`npx tsx tests/run-tests.ts`) |

---

## 2. Technical Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js, Express, tsx.
- **Persistence**: Atomic file-backed JSON database (`data/hvac-db.json`) with auto-recovery and memory caching.
- **AI Engine**: Server-side Google Gemini 3.8 Flash via `@google/genai` with strict nonhazardous safety boundaries.
- **SEO & Social**: Schema.org `HVACBusiness` structured data, dynamic XML sitemap at `/sitemap.xml`, and clean `/robots.txt`.

---

## 3. Development & Execution Instructions

### Running in Development
```bash
npm run dev
```
Starts the full-stack server on port 3000 with Vite middleware mounted.

### Running Automated Tests
```bash
npx tsx tests/run-tests.ts
```
Executes test suite verifying currency arithmetic, load sizing math, ZIP code coverage, and concurrency checks.

### Building for Production
```bash
npm run build
npm start
```
Bundles client-side assets with Vite and compiles `server.ts` into `server.js` using esbuild.

---

## 4. Integration Setup Guide

The platform provides live backend adapters and configuration panels for external services (`/admin > Integrations`):

1. **Gemini 3.8 Flash AI Assistant**:
   - Set `GEMINI_API_KEY` in environment variables or Google AI Studio Secrets.
   - Handled exclusively on the server (`server/gemini.ts`).

2. **HubSpot CRM**:
   - Set `HUBSPOT_API_KEY` in `.env`.
   - Incoming leads and emergency requests automatically mirror to CRM deals.

3. **Twilio SMS Dispatch**:
   - Set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`.
   - Sends real-time text alerts to on-call technicians when emergencies arrive.

4. **SendGrid Transactional Email**:
   - Set `SENDGRID_API_KEY`.
   - Dispatches appointment confirmations and downloadable `.ics` calendar events.

5. **Stripe Payments**:
   - Set `STRIPE_PUBLISHABLE_KEY` and secret.
   - Powers Comfort Club recurring subscriptions and online deposit payments.

---

## 5. Security & Production Checklist

- [x] Server-side API key handling (no private credentials in browser bundles).
- [x] Input sanitization and email/phone format validation.
- [x] Concurrency-safe double booking prevention on appointment slots.
- [x] Role-based persona simulation (Customer, Dispatcher, Technician, Admin).
- [x] Atomic write operations for persistent data storage.
- [x] WCAG AA contrast compliance and touch targets $\ge 44\text{px}$ on mobile.
- [x] Emergency triage safety disclaimers for hazardous gas or electrical faults.
