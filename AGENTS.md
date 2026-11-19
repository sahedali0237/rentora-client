# AGENTS.md

## Next.js Version Warning
This repository uses Next.js 16.4.6 with the app router. APIs and conventions differ from older versions. Always consult the official Next.js documentation for the current version before implementing features.

## Development Commands
- **Start dev server**: `npm run dev` (also works with `yarn dev`, `pnpm dev`, or `bun dev`). Runs on `http://localhost:3000`.
- **Build production**: `npm run build`.
- **Run production server**: `npm run start`.
- **Lint**: `npm run lint` (executes ESLint on the codebase).

## Project Structure
- **App entry**: `/app` directory contains `layout.tsx` (root layout) and `page.tsx` (home page). All pages use the Next.js app router.
- **UI components**: Provided by `shadcn/ui` (e.g., `Button`, `Input`). Imported globally via `app/globals.css`.
- **Styling**: TailwindCSS is configured in `app/globals.css`. Custom CSS variables are defined there; no separate `tailwind.config.js` in the root.
- **TypeScript**: `tsconfig.json` uses Next.js compiler plugin, strict mode, and supports JSX with `react-jsx`.

## Linting & Formatting
- ESLint configuration lives in `eslint.config.mjs`. It extends `eslint-config-next` and enables TypeScript rules.
- Run `npm run lint` to lint the entire repo. No dedicated format command; ESLint fixes can be applied via `--fix` if needed.

## Testing
- The main repo does not ship with test scripts. For unit/component testing, use the gallery submodule’s test setup (`npm run test` there) or implement your own tests.

## Environment Variables
- Follow Next.js conventions (`/.env.local`, `/.env.development`, `/.env.production`). No `.env` files are currently present.

## Build Output
- Next.js outputs to the `.next` directory (ignored via `.gitignore`). Do not commit `.next`.

## Deployment
- The app is configured for deployment on Vercel (see README). For local production testing, run `npm run start`.

### Midnight auto-approval

Every day at 12:00 AM (UTC), a scheduled job auto-approves all pending equipment listings.

- **Endpoint:** `POST /api/equipment/auto-approve`
- **Guard:** requires the `x-auto-approve-secret` header (or `?secret=` query param) to match the `AUTO_APPROVE_SECRET` environment variable.

**Setup:**

1. Add a new environment variable in the Vercel dashboard:
   `AUTO_APPROVE_SECRET` = any strong random string (e.g. `openssl rand -hex 32`).
2. Create a **Vercel Cron Job** (Vercel dashboard → Project → Functions → Cron Jobs → Add):
   - **URL:** `https://<your-project>.vercel.app/api/equipment/auto-approve`
   - **Method:** `POST`
   - **Schedule:** `0 0 * * *` (every day at 00:00 UTC)
   - **Header:** add `x-auto-approve-secret` = the value of `AUTO_APPROVE_SECRET`

> The app is deployed to Vercel (see above); the cron job runs on Vercel's schedule and calls the protected endpoint. Without the matching secret the request returns `401`.

## Common Gotchas
- The app uses the new Next.js 16 app router; avoid mixing pages router syntax.
- Tailwind classes must be defined in `globals.css`; adding new utilities requires updating Tailwind config or using existing classes.
- ESLint ignores `.next`, `out`, and `build` directories; ensure lint runs after build if needed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
