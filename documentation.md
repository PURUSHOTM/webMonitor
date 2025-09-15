# WebMonitor Pro — Documentation

This document explains the implementation of the main features, important files and code segments, UI behavior, and the technology stack used in this repository.

---

## Table of contents
- Overview
- Tech stack
- Project layout
- Features and implementation details
  - Server / API
  - Database initialization & storage
  - Website CRUD (Add/Edit/Delete)
  - Monitoring service and results
  - Notifications
  - Dashboard & Analytics
  - Sidebar & Navigation
  - Responsive layout & compact mode
  - Confirmations for sensitive actions
  - Settings and appearance
- How to run locally
- Troubleshooting
- Integrations & Suggestions

---

## Overview
WebMonitor Pro is a full-stack web application to monitor websites, show status, and notify incidents. The project is split into a client (React + Vite + Tailwind) and a server (Express + Drizzle ORM + Neon). The server exposes JSON REST endpoints under `/api/*` and the client consumes them via react-query.

## Tech stack
- Frontend: React 18, Vite, TypeScript, TailwindCSS, lucide-react icons, @tanstack/react-query
- Backend: Node (tsx developer runner), Express, TypeScript
- Database: PostgreSQL (Neon-compatible) via drizzle-orm + neon serverless driver
- Validation: Zod / drizzle-zod
- Deployment & Hosting: (project used Fly / preview server in the environment)

---

## Project layout (important files)
- server/
  - index.ts — App boot and route registration
  - routes.ts — All HTTP routes (websites, monitoring-results, notifications, settings)
  - db.ts — Drizzle neon client initialization
  - init-db.ts — Creates required tables and indexes if missing
  - storage.ts — DatabaseStorage and MemStorage (CRUD wrappers)
  - services/monitor.ts — Background monitoring service (runner)
- client/
  - src/
    - pages/ — pages (dashboard.tsx, websites.tsx, analytics.tsx, notifications.tsx, settings.tsx)
    - components/
      - dashboard/ — sidebar.tsx, app-layout.tsx, add-website-modal.tsx, website-status-list.tsx, recent-activity.tsx, uptime-chart.tsx
      - ui/ — Button, Card, Dialog, ConfirmDialog, Input, Label, Switch, Toast, Tabs, etc.
    - lib/ — queryClient.ts, ui-settings.tsx

---

## Features and implementation details

### Server / API
File: server/routes.ts
- Exposes REST endpoints used by the client:
  - GET /api/websites
  - POST /api/websites
  - GET /api/websites/:id
  - PUT /api/websites/:id
  - DELETE /api/websites/:id
  - GET /api/monitoring-results
  - GET /api/monitoring-results/latest
  - GET /api/websites/:id/monitoring-results
  - GET /api/notifications
  - DELETE /api/notifications
  - GET /api/dashboard/stats
- Uses the shared `storage` instance (server/storage.ts) to perform DB operations and returns proper HTTP codes.

Example snippet:
```ts
app.post("/api/websites", async (req, res) => {
  try {
    const validatedData = insertWebsiteSchema.parse(req.body);
    const website = await storage.createWebsite(validatedData);
    res.status(201).json(website);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```

### Database initialization & storage
Files: server/db.ts, server/init-db.ts, server/storage.ts
- `server/db.ts` initializes drizzle with Neon. We export `db` and `rawSql` (the raw neon client) so raw queries are possible.
- `server/init-db.ts` contains `CREATE TABLE IF NOT EXISTS` statements for `websites`, `monitoring_results`, `notifications`, and `settings`. This file is called at server startup to ensure missing tables are created (useful for ephemeral deployments).
- `server/storage.ts` contains two storage backends:
  - `MemStorage` — in-memory storage (used in tests or fallback).
  - `DatabaseStorage` — production storage using drizzle. It performs SQL operations and returns typed models.

Important detail: Storage wraps operations with retry logic to run `initDatabase()` if a missing relation (table) is detected, which helps self-heal when tables are absent.

### Website CRUD (Add / Edit / Delete)
Client components involved:
- client/src/components/dashboard/add-website-modal.tsx — Modal form to create websites (react-hook-form + zod validation). The form posts to `/api/websites`.
- client/src/pages/websites.tsx — Listing and editing websites. Uses react-query queries and mutations to fetch, create, update and delete.
- client/src/components/dashboard/website-status-list.tsx — Shows websites on the dashboard with status and actions.

Key server handler: POST /api/websites in server/routes.ts validates payload with `insertWebsiteSchema` from shared/schema.ts.

Example payload used by the UI:
```json
{"name":"My Site","url":"https://example.com","checkInterval":5,"enableNotifications":true}
```

### Monitoring service and results
Files: server/services/monitor.ts, server/routes.ts
- The monitoring service runs checks for each website at configured intervals and writes `monitoring_results` rows.
- The client queries endpoints such as GET /api/monitoring-results/latest or GET /api/websites/:id/monitoring-results to show latest data.

Dashboard stats endpoint (`/api/dashboard/stats`) aggregates latest monitoring results and settings to compute metrics: websitesOnline, totalWebsites, avgResponseTime, uptimePercentage, incidentCount.

### Notifications
Files: server/routes.ts, server/storage.ts, client/src/pages/notifications.tsx
- Server exposes GET /api/notifications and DELETE /api/notifications to fetch and clear notifications.
- Notifications are created by the monitoring service when an incident (down/slow) is detected.
- Client notifications page provides filtering, search, and action buttons. The UI uses a `ConfirmDialog` to confirm clearing all notifications.

### Dashboard & Analytics
Files: client/src/pages/dashboard.tsx, client/src/pages/analytics.tsx, client/src/components/dashboard/*.tsx
- Dashboard page composes smaller components: MetricsOverview, WebsiteStatusList, UptimeChart, RecentActivity.
- Analytics page uses react-query to gather historical and latest monitoring data and computes charts and metrics.
- When "Show Advanced Metrics" is enabled (Settings > Appearance), Analytics renders an additional advanced metrics card.

Snippet (analytics conditional):
```tsx
const { showAdvancedMetrics } = useUISettings();
...
{showAdvancedMetrics && (
  <Card data-testid="card-advanced-metrics"> ... </Card>
)}
```

### Sidebar & Navigation
File: client/src/components/dashboard/sidebar.tsx
- Sidebar is a shared component providing navigation links to main pages (Dashboard, Websites, Analytics, Notifications, Settings).
- Each link has a `data-testid` attribute for tests (e.g. `data-testid="link-dashboard"`).
- The Sidebar supports collapsed state and keyboard accessible toggles.

### Responsive layout & compact mode
Files: client/src/components/dashboard/app-layout.tsx, client/src/index.css, client/src/lib/ui-settings.tsx
- AppLayout places the Sidebar and the main content. It provides a mobile menu button to toggle sidebar visibility.
- `ui-settings.tsx` provides a React context storing UI preferences (theme, compactMode, showAdvancedMetrics) persisted in localStorage.
- Compact Mode applies CSS adjustments using a `data-compact` attribute on the body. Example rules live in `client/src/index.css` and shrink spacing & font sizes when `compactMode` is on.

### Confirmations for sensitive actions
Files: client/src/components/ui/confirm-dialog.tsx, usages in website lists and notifications
- A reusable `ConfirmDialog` component wraps a Dialog and exposes `onConfirm` and `onClose` callbacks.
- Used for delete website, clear all notifications, and other destructive actions to prevent accidental changes.

### Settings and appearance
Files: client/src/pages/settings.tsx, client/src/lib/ui-settings.tsx
- Settings page allows toggling theme (light/dark/system), Compact Mode, and Show Advanced Metrics.
- `useUISettings` persists choices to localStorage and applies CSS class `dark` to document when theme is dark.

---

## How to run locally
1. Ensure environment variables are set (DATABASE_URL). Example in development this repo uses Neon or similar provider.
2. Install dependencies: `npm ci` or using recommended `ni` in the project (see package.json scripts).
3. Run dev server: `npm run dev` — this runs `tsx server/index.ts` which starts the Express server and Vite.
4. The server ensures DB schema by running `server/init-db.ts` at startup.

Notes:
- API base path: `/api/*` (served from the same host/port in dev)
- Client preview is available at the dev server host/port (5000 by default in this environment).

---

## Troubleshooting & common errors
- Missing tables ("relation \"websites\" does not exist"): init-db creates tables at startup. If you still hit the error, make sure the DB user has permission to create extensions and tables and that DATABASE_URL points to a valid Postgres instance.
- `body stream already read`: Ensure custom utility `apiRequest` and response handling read the body only once. Use `response.clone()` if you need to read body multiple times.
- Dev server syntax errors (duplicate imports): remove duplicate React / hook imports (e.g., `import React, { useState }` and `import { useState } from 'react'` both present) — Vite fails with duplicate declaration. See recent fixes in `client/src/components/dashboard/app-layout.tsx` and `client/src/pages/settings.tsx`.

---

## Additional improvements & next steps
- Add tests (unit and integration) to verify API endpoints and UI behavior.
- Add role-based access & authentication if multi-user support is required.
- Add richer monitoring checks (content validation, multi-region checks) and scheduled job telemetry.
- Integrate Sentry / logging to gather runtime errors in production.

## Suggested MCP Integrations (Builder.io environment)
The repository can be enhanced by connecting these MCPs depending on needs:
- Neon (connect to run the Postgres database) — useful to provision DB and manage connections. Click [Connect to Neon](#open-mcp-popover).
- Netlify (deploy static artifacts) — use for frontend deployment. Click [Connect to Netlify](#open-mcp-popover).
- Supabase / Prisma Postgres (alternative DB/ORM workflows).
- Sentry for error monitoring — Click [Connect to Sentry](#open-mcp-popover).
- Builder CMS for content management — Click [Connect to Builder.io](#open-mcp-popover).
- Zapier for automated workflows (SMS/email triggers), Figma plugin for design->code conversion.

---

## Files & code references (quick list)
- server/routes.ts — HTTP endpoints and response handling
- server/db.ts — drizzle + neon initialization
- server/init-db.ts — DDL statements for tables and indexes
- server/storage.ts — DB access layer and fallback MemStorage
- client/src/lib/queryClient.ts — apiRequest wrapper and react-query client
- client/src/lib/ui-settings.tsx — UI preferences provider (theme/compact/advanced)
- client/src/components/ui/confirm-dialog.tsx — generic confirm modal
- client/src/components/dashboard/sidebar.tsx — navigation
- client/src/components/dashboard/app-layout.tsx — layout & mobile toggle
- client/src/components/dashboard/add-website-modal.tsx — add website form (zod + react-hook-form)
- client/src/components/dashboard/website-status-list.tsx — dashboard list with status and delete action
- client/src/pages/websites.tsx — websites management page
- client/src/pages/notifications.tsx — notifications page and filters
- client/src/pages/settings.tsx — settings page wired to UI settings provider

---

If you want, I can:
- Generate a markdown with embedded code examples for each file (I already included many references above).
- Create a developer quickstart script that bootstraps Neon and migrations.
- Export an OpenAPI spec for the server endpoints.

Tell me which of the above you'd like next and I will implement it.
