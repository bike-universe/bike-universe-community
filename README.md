# Bike Universe Community 2.0

Next.js + TypeScript + MapLibre + Supabase/PostGIS MVP.

## Current status

- Live Supabase connection is wired.
- Categories are loaded from `public.categories`.
- Hidden Gems hierarchy is supported through `categories.parent_id`.
- Published places are loaded from `public.places`.
- Upcoming events are loaded from `public.events`.
- Map filters support top-level categories plus a second row for Hidden Gems subcategories.
- When the database has no published places/events yet, the UI remains usable and clearly shows the empty live state.

## Local start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

`.env.local` is ignored by git.

## Database migrations

The schema currently in Supabase corresponds to:

- `supabase/migrations/001_initial.sql`
- `supabase/migrations/002_hidden_gems_hierarchy.sql`

The production project already has the full 22-category hierarchy (6 top-level + 16 Hidden Gems subcategories).

## Next milestone

1. Add authentication (email + Google).
2. Replace local Saved/Joined state with `favorites` and `event_participants` in Supabase.
3. Build real Add Place / Create Event forms.
4. Import existing WordPress/GeoDirectory locations.
5. Deploy through GitHub + Vercel.
