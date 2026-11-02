<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GymFlow

Multi-tenant SaaS for gyms (members, plans, payments). Next.js 16.4 App Router, React 19, Prisma 7 + PostgreSQL, Auth.js v5 beta. Auth, plans, members, payment recording, in-app due alerts, owner-side gym management, and gym-admin staff management exist; external notifications and deployment are not implemented.

## Commands

- `npm run dev` — Turbopack dev server (needs the local DB running first).
- `npm run lint`, `npm test`, `npx tsc --noEmit`, and `npm run build` are the verification steps. Integration tests need the local DB running. The test runner is serial because Prisma's integrated PostgreSQL can fail on concurrent prepared queries.
- `npm run db:migrate` — `prisma migrate dev`; add a migration for every `prisma/schema.prisma` change.
- `npm run db:generate` — regenerate the Prisma client (also runs on `npm install`).
- `npm run db:seed` — idempotent demo org/users/plans.
- `npm run db:studio` — Prisma Studio.

## Local database

- Prisma 7's local Postgres: `npx prisma dev -d` starts it, `npx prisma dev ls` shows the TCP URL to put in `DATABASE_URL`. Restart it after rebooting; the app fails without it.
- `AUTH_SECRET` is required (the route proxy uses it); generate with `npx auth secret`.
- Prisma config is `prisma7.config.ts` (not the default `prisma.config.ts`); the seed runs via `tsx prisma/seed.ts`.

## Architecture

- Isolation is per row, one shared schema: every business table has `organizationId`. Every `plans` / `members` / `payments` query MUST filter by the session's organization; never trust an org id from the client. For member plan assignments, also check that the plan belongs to that organization and is active (except a member retaining their already assigned inactive plan).
- Member data access and validation live in `src/server/members/`; server actions in `src/server/actions/members.ts` call `requireOrgSession()` on every mutation. Member records have reversible active/inactive status; this is **not** payment status. Member search is case-insensitive but currently accent-sensitive.
- Payment validation, period calculation and tenant-scoped transactions live in `src/server/payments/`. The payment action checks the session, not a client-provided org. Use a serializable transaction when appending payments and moving `nextPaymentDate`; keep historical payments immutable. An inactive member or member without a plan cannot pay; a previously assigned inactive plan can still be paid. Payments cover `[periodStart, periodEnd)` in UTC; plan duration is measured in calendar days.
- Due-date summaries and paginated alerts live in `src/server/dues/`; they filter by the session org and active status. Alerts use Nicaragua calendar days (today starts at 06:00 UTC for the current UTC−06:00 operating period): overdue = date before today, upcoming = today through day six, unpaid = null date and **not** overdue. The dashboard previews five; `/dashboard/alerts` lists all with filters and pagination. Alerts are in-app only (no SMS/email/WhatsApp).
- Gym provisioning, status and manual B2B paid-through dates live in `src/server/organizations/`; every platform mutation calls `requirePlatformOwner()`. The initial admin is created atomically with the gym. The owner supplies an initial password via form; store only the bcrypt hash, never return or log the password, and deliver it separately through a private channel. `subscriptionPaidUntil` includes the selected Nicaragua date; it is informational, **not** an automatic suspension trigger. Only manual status changes suspend access.
- Staff access lives in `src/server/staff/`; management actions require `requireOrgAdmin()` and derive the organization from the session. Creation sets only `role: "staff"`; listing and status updates scope to both `organizationId` and `role: "staff"`, never affecting admins or other gyms. Passwords are hashed and never returned. `User.active` defaults to true and is checked on login and on each protected request, including existing sessions. Deactivation is reversible.
- Self-service password changes live in `src/server/account/` and `/account/password`. Authenticate each action against the current DB state before reading credentials. The user must supply their existing password; hash the new one and atomically increment `User.sessionVersion` via a compare-and-swap. The JWT carries the version and both org and platform guards compare it to the DB on every protected request. Changing a password signs out the current session and revokes other sessions on their next request. Do not add passwords to logs or URLs.
- Manual password reset also lives in `src/server/account/`: gym-admin actions call `requireOrgAdmin()` and update only `staff` in the session's organization; platform actions call `requirePlatformOwner()` and update only `admin` in the selected gym. Every reset increments `sessionVersion` and preserves active/suspended state. Validate 12–72 UTF-8 bytes, store only bcrypt hashes, never echo the password, and deliver it privately. No email/SMS/WhatsApp reset flow exists.
- Session guards live in `src/lib/session.ts`: `requireSession`, `requireOrgSession` (sends `platform_owner` to `/admin` and checks the current DB status of both user and gym on every protected read/mutation), `requireOrgAdmin` (sends staff to `/dashboard`), `requirePlatformOwner` (sends everyone else to `/dashboard`). Roles are plain strings (`platform_owner | admin | staff`), not Prisma enums; validate with Zod in server code.
- Data access goes through `prisma` from `src/lib/db.ts`. It uses the `PrismaPg` driver adapter and the generated client at `src/generated/prisma` (gitignored). Import `@/generated/prisma/client`, never `@prisma/client`.
- Route protection is `src/proxy.ts` (Next.js 16 renamed `middleware.ts`). Its matcher covers `/login`, `/dashboard/:path*`, `/admin/:path*`, and `/account/:path*`; update it when adding protected routes. `/login` must remain accessible with an existing JWT because a revoked account can still hold a cookie; server-side guards enforce current database access.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. With Cache Components, reading the session is flagged by instant-navigation validation; protected dashboard/admin/member pages opt out with `export const instant = false;`. Keep that pattern (or wrap the read in `<Suspense>`) for new session-reading pages. Next.js 16 `params` and `searchParams` are promises.
- App routes are grouped as `(auth)`, `(dashboard)`, `(admin)`; member routes are `/dashboard/members`, `/dashboard/members/new`, `/dashboard/members/[id]/edit`, `/dashboard/members/[id]/payments`; dues are in `/dashboard` and `/dashboard/alerts`; staff management/reset is `/dashboard/staff` and `/dashboard/staff/[id]/password`; self-service password change is `/account/password`; platform routes are `/admin`, `/admin/new`, `/admin/[id]`, `/admin/[id]/admins/[userId]/password`. API auth handlers live in `src/app/api/auth/[...nextauth]`. Server-side data access belongs in `src/server/`.
- Data model, business rules, and role permissions are documented in `docs/architecture.md`; update it when the schema or rules change.

## Conventions

- UI copy and docs are Spanish; code identifiers, commits, and branch names are English. Conventional Commits; `main` is merge-only, branches use `feature/…`, `fix/…`, `chore/…`, `docs/…`.
- Auth.js is JWT-session-based (required to carry `organizationId`/`role`). Augment new session fields in `src/types/next-auth.d.ts`, the `jwt`/`session` callbacks in `src/lib/auth.ts`, and the authorize return value together.
- shadcn/ui here is built on **Base UI** (`@base-ui/react`), not Radix, so component APIs differ. Add components with `npx shadcn add <name>` (config in `components.json`, output to `src/components/ui`).
- `.gitattributes` enforces LF line endings; keep new files LF.
