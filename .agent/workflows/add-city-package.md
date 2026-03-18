# Add New City Package Workflow

Follow these steps to correctly add or expand a city package:

1. Create a new SQL seed file in `db/sql/` following the established naming convention and schema. Use a unique `slug` for each checkpoint.
2. Synchronize the frontend constants in `shared/messenger.js` by adding the city to `checkpointsByCity` and `cityDisplayNames`. Ensure the checkpoint data matches the SQL definition.
3. Add the city name to the correct continent group in `ALLEYCAT_CITY_GROUPS` within `src/App.tsx`.
4. Update the "Growth Report" section in `src/components/pages/CitiesPage.tsx` to announce the update.
// turbo
5. Execute the SQL migration on Supabase and deploy the frontend changes.
