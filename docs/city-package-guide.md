# City Package Workflow

Follow these steps to correctly add or expand a city package in Gimme The Loop.

## 1. Database Seed (SQL)
Create a new SQL file in `db/sql/` (e.g., `munich_city_seed.sql`).

- **Target Table**: `public.city_checkpoints`.
- **Relationship**: Link to the correct `city_packs` entry using `pack_id`.
- **Columns**: `slug`, `name`, `lat`, `lng`, `district`, `category`, `vibe`, `hint`, `task_local`, `task_fast`, `task_chaotic`.
- **Constraint**: Use `on conflict (slug) do update` to allow for easy re-runs/updates.

## 2. Shared Constants (`shared/messenger.js`)
Synchronize the frontend constants with the database data.

- **`checkpointsByCity`**: Add the new city array with checkpoint objects.
- **`cityDisplayNames`**: Map the city slug to its display name (e.g., `munich: "Munich"`).
- **Format**: Ensure `lat` and `lng` are numbers, and `id` matches the database `slug`.

## 3. UI Groups (`src/App.tsx`)
Categorize the city for filtering and selection.

- Locate `ALLEYCAT_CITY_GROUPS`.
- Add the city name to the correct continent group (`Americas`, `Europe`, or `Asia`).

## 4. Cities Page Editorial (`src/components/pages/CitiesPage.tsx`)
Highlight the update for users.

- Locate the `editorial-growth` section (Growth Report).
- Add a `<div className="growth-item">` for the new city.
- Use `<span className="mini-chip active">` for brand new cities.
- Use `<span className="mini-chip">` for expanded existing cities.

## 5. Deployment
Finalize the rollout.

1.  **Supabase**: Run the SQL script in the Supabase SQL Editor.
2.  **Build**: Run `npm run build`.
3.  **Deploy**: Deploy to production (e.g., `npx wrangler pages deploy dist`).

---
> [!IMPORTANT]
> Always verify coordinates and district names against real-world data to maintain the industrial/authentic vibe. No tourism loops.
