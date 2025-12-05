# Next.js Best Practices Playbook (Agents)

Industry-grade guidance for modern Next.js (App Router, React 19). Tailored for professional teams; avoid mirroring any ad‑hoc project structures.

## Project Setup
- Use Node.js LTS and lockfile (`package-lock.json` or `pnpm-lock.yaml`) committed.
- Enable TypeScript strict mode; keep `tsconfig` lean with path aliases for `app`, `lib`, `components`.
- Use Turbopack for dev (`next dev --turbopack`) and the default Next.js compiler for production until Turbopack prod is stable.
- Keep environment-specific configs out of code; rely on `.env.local` (never commit).

## File & Folder Organization (App Router)
- Top-level shape: `app/` (routes), `components/` (shared UI), `lib/` (server logic, utilities), `types/` (shared types), `public/` (static assets), `tests/` (playwright/unit), `scripts/` (one-off tasks).
- In `app/`, keep `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` adjacent to their route segment. Use route groups `(marketing)` `(app)` to separate concerns without affecting URLs.
- Co-locate route-specific pieces under the route: `app/(app)/dashboard/_components/*`, `app/(app)/dashboard/actions.ts` (server actions), `app/(app)/dashboard/loading.tsx` (skeletons). This limits blast radius and keeps imports relative.
- Shared UI goes in `components/` (stateless, mostly client-safe). Shared server utilities and data clients live in `lib/`, with subfolders like `lib/db`, `lib/api`, `lib/auth`. Keep `lib/*` server-safe unless explicitly client-compatible.
- Avoid putting providers and large client trees in the root layout; add a dedicated `app/providers.tsx` and import only what every page truly needs.
- Keep server-only modules (`lib/db`, secrets, server actions) free of client-only imports (no `use client` trees). Add `use client` narrowly and at the leaf where interactivity is required.

## Routing & Navigation
- Prefer nested layouts for shared chrome; avoid prop-drilling via layout contexts.
- Use `generateMetadata`/`metadata` for per-route SEO; avoid client-side head mutation.
- Use intercepting routes and parallel routes for modals/split views instead of global state hacks.

## Data Fetching & Mutations
- Prefer Server Components for data-heavy views; keep clients lean.
- Use `fetch` with `next` options: `{ cache: 'force-cache' | 'no-store', revalidate: seconds, tags: [...] }`.
- For ISR/SSG-like behavior, set `export const revalidate = X` at the route or use `fetch` revalidation tags.
- Use Server Actions for authenticated mutations; validate inputs (zod / valibot) at the boundary.
- Avoid client-side `.env`; expose only via `NEXT_PUBLIC_*` when safe.

## Client vs Server Components
- Default to Server Components; add `use client` only when you need browser APIs, interactivity, or stateful hooks.
- Keep `use client` components small; pass data from parents rather than refetching on the client.
- Avoid importing server-only modules inside client trees (DB, secrets, filesystem).

## Performance
- Enable React compiler defaults; keep components pure when possible.
- Use `Image` and `next/font` to optimize media and fonts; avoid layout shift.
- Split code by route naturally; avoid large client bundles in shared layouts.
- Memoize expensive client work (`useMemo`, `useCallback`) only when profiling shows benefit.
- Measure with Lighthouse, Web Vitals, and Next.js trace output; fix regressions before release.

## Caching & Revalidation
- Use route segment `revalidate` for periodic data; use `cache: 'no-store'` for per-request freshness.
- Invalidate via `revalidateTag`/`revalidatePath` from Server Actions after writes.
- Avoid mixing `no-store` and long-lived caches on the same resource without clear intent.

## Styling & UI
- Prefer utility-first CSS (e.g., Tailwind). Keep design tokens in `tailwind.config.{js,ts}`.
- Use component-level patterns: primitive UI library + light wrappers; avoid heavy global CSS.
- Keep `globals.css` minimal (resets, typography, theme variables).
- Ensure consistent spacing/typography scale; document in a short design tokens section.

## Forms & Actions
- Use progressive enhancement: native forms + Server Actions where possible.
- Validate on the server (zod/valibot) and mirror critical rules on the client for UX.
- Handle error states via `useFormState` / `useFormStatus`; show optimistic updates cautiously.

## Auth & Security
- Prefer middleware + server checks over client gating; never trust client flags.
- Store secrets only on the server; keep `NEXT_PUBLIC_*` free of sensitive data.
- Use `cookies()`/`headers()` APIs in server routes; sign cookies (HttpOnly, Secure, SameSite=Lax/Strict).
- Sanitize user input; escape output; apply rate limiting on sensitive routes.
- Keep dependencies updated; run `npm audit`/`pnpm audit` regularly.

## Accessibility
- Ensure semantic HTML; use `aria-*` only to enhance, not replace semantics.
- Provide focus states, skip links, and logical tab order.
- Use `next/image` alt text; prefer buttons over clickable divs; ensure color contrast.

## Testing & Quality
- Add unit tests for pure logic (e.g., utilities, helpers).
- Add integration/component tests for key routes and interactive components (Playwright/Testing Library).
- Run `next lint` and type-check in CI; block merges on failures.

## Observability & Logging
- Use structured logs on the server; avoid `console.log` in production client bundles.
- Monitor Web Vitals; surface telemetry in CI dashboards.
- Capture unhandled errors with an error boundary or APM where permitted.

## Deployments & Environments
- Enforce preview deployments per PR; validate lint, type-check, tests, and `next build`.
- Keep environment parity: dev/preview/prod env vars aligned; rotate secrets regularly.
- For edge use-cases (low latency, simple logic), opt into the Edge runtime per route; otherwise prefer Node runtime for compatibility.

## Migrations & Data
- Manage schema with migrations (Prisma/Migration tool of choice); commit migration files.
- Backfill and run migrations in CI/CD before exposing new code paths.
- Version APIs; avoid breaking changes without compatibility windows.

## Checklists
- **Pre-merge**: lint, type-check, tests, `next build`, preview link verified.
- **Performance**: check bundle size, `Image`/font usage, caching strategy, no accidental `use client` at layout root.
- **Security**: secrets server-only, cookies secured, inputs validated, dependencies up to date.
- **Accessibility**: semantic markup, focus management, contrast, keyboard paths covered.

## Recommended Defaults
- Scripts: `dev: next dev --turbopack`, `build: next build`, `start: next start`, `lint: next lint`, `test: your runner`.
- Tooling: ESLint with `next/core-web-vitals`, Prettier (optional), TypeScript strict, Playwright for E2E.

## Anti-Patterns to Avoid
- Catch-all `use client` at app root; pulling server code into client bundles.
- Ad-hoc global state for routing concerns; prefer router features.
- Unbounded `cache: 'no-store'` where caching is safe; or vice versa without invalidation.
- Hardcoding envs in code; committing `.env.local`.
- Large shared client providers in `app/layout.tsx` that bloat every page.

---

Use this as a baseline; adapt per product needs, but keep the discipline: secure by default, server-first, lean client bundles, and verified in CI before shipping.

