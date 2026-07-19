# Momento

A digital memory book. Your moments, told like a story — not stored like files.

**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 · Framer Motion · Supabase (Postgres, Auth, Storage) · Google Maps · Vercel

---

## Quick start

```bash
pnpm install
cp .env.example .env.local     # fill in the values below
pnpm dev                       # http://localhost:3000
```

### 1. Supabase

1. Create a project at supabase.com → Settings → API → copy the **Project URL**
   and **anon key** into `.env.local`.
2. Run the migrations **in order** (SQL Editor, or `supabase db push` via CLI):
   - `supabase/migrations/20260718000001_initial_schema.sql`
   - `supabase/migrations/20260718000002_storage.sql`
   - `supabase/migrations/20260718000003_photo_size.sql`

### 2. Google sign-in

1. Google Cloud Console → Credentials → **OAuth client ID** (Web application).
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → paste client ID + secret.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`
     (add your Vercel domain equivalents when you deploy).

### 3. Sample data (optional but recommended)

Sign in with Google **once**, then run `supabase/seed.sql` in the SQL Editor.
It attaches 5 sample albums (~36 photos, portrait + landscape mix) to your
account so Home, Timeline, Map, the collage, and stats are instantly alive.
Safe to re-run; delete the sample albums in-app whenever you like.

### 4. Google Maps (for the Map tab)

Google Cloud Console → enable **Maps JavaScript API** → create an API key →
put it in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Without it the Map tab shows a
friendly notice; everything else works.

### 5. Deploy (Vercel)

Import the repo, set the three env vars, deploy. Then add
`https://your-app.vercel.app` as Site URL / redirect URL in Supabase.

---

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm typecheck` — strict TS
- `pnpm lint`

## Architecture

```
src/
  app/                # routes only — no business logic
    (app)/            # 5-tab shell: Home, Map, + Create, Timeline, Profile
    login/  auth/     # public auth surface
  components/         # shared presentational (navigation, ui, theme)
  features/           # vertical slices: albums, collage, photos, create, map
  services/           # server data access — the only place that queries the DB
  hooks/              # shared custom hooks
  lib/                # pure utilities (collage engine, image compression, …)
  types/              # domain types + typed DB schema
  config/             # static config (nav)
supabase/
  migrations/         # schema, RLS, storage policies
  seed.sql            # sample data
```

Import rule: `app → features → services/components → lib/types`. Never upward.

## Feature notes

- **Auto Collage Engine** (`src/lib/collage.ts`) — a pure, deterministic
  justified-rows algorithm. Same album ⇒ same collage (seeded by album id);
  different albums ⇒ different rhythm. Aspect ratios are preserved exactly;
  landscape favorites can become full-bleed hero rows. 16px gaps, 20px radius.
- **Uploads** compress client-side (max edge 2048px, WebP q0.82) before
  hitting Storage; per-photo status + overall progress bar.
- **Security** — RLS on every table (owner-only), storage writes locked to
  `photos/{user_id}/…`. Reads are public-by-URL (unguessable UUID paths).
- **Dark mode** — toggle on Profile; saved preference applied pre-paint.
- **Infinite scroll** — album photos page in at 60/batch via an
  IntersectionObserver sentinel.
- **Offline** — installable PWA manifest; images/pages rely on standard
  HTTP + next/image caching. (A full offline service worker is not included.)
- **A11y** — keyboard nav throughout (viewer: ←/→/Esc), ARIA labels/roles,
  visible focus rings, `prefers-reduced-motion` respected globally.
