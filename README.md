
# Jewelry POS (Electron + React + Tailwind + Prisma/SQLite)

Desktop app scaffold for your jewelry shop. Focus: **Items inventory, Auth, Task Logs, Backups**. 
Stack: Electron (desktop), React + Tailwind (renderer), Prisma + SQLite (DB), IPC adapters for "Express-style" controllers.

## Quick Start (Windows/macOS)
1) Install **Node 20+** and **Git**.
2) `git clone <your-repo-url>` (or unzip this folder) and open a terminal in the project root.
3) Install deps (root + all workspaces):  
   ```bash
   npm install
   ```
4) Initialize the database (SQLite) and seed demo data:  
   ```bash
   npx prisma migrate dev --name init
   node scripts/seed.mjs
   ```
5) Run the app in development:  
   ```bash
   npm run dev
   ```
   - This launches Vite (renderer) and Electron.
6) Build production app (installer):  
   ```bash
   npm run build && npm run dist
   ```

> If `prisma` CLI prompts for a datasource, it's already configured in `packages/platform/prisma/schema.prisma`.

## Workspace layout
```
apps/
  desktop/
    electron/   # Electron main + preload + IPC routes
    renderer/   # React + Vite + Tailwind UI
packages/
  platform/     # Prisma client, config, event-bus, shared infra
  auth/         # login/session logic
  inventory/    # items CRUD + state machine (minimal)
  audit/        # task logs
  backup/       # snapshot stubs
shared/
  validation/   # zod schemas
  dto/          # TypeScript DTOs
scripts/
  seed.mjs
prisma/
  schema.prisma # imports models for Prisma (single file for SQLite target)
```

## Default credentials (demo)
- Email: `admin@example.com`
- Password: `admin123`

(These are created by `scripts/seed.mjs`. Change or remove in production.)

## Notes
- SQLite file lives in `.data/dev.db` (dev) and `.data/prod.db` (prod).
- Tailwind is set up; edit `apps/desktop/renderer/src/styles/tailwind.css` & `tailwind.config.js`.
- IPC only; no HTTP ports are opened in dev by default.
