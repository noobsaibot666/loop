import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, renameSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_DOMAIN = "@seed.hardchain.app";
const REGISTRY_PATH = resolve(__dirname, "seed-data/registry.json");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!existsSync(REGISTRY_PATH)) {
  console.error("No registry.json found. Nothing to clean up.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
const { all_user_ids, all_manifest_ids, all_run_ids, all_proof_post_ids,
        all_night_ride_session_ids, all_night_ride_post_ids, storage_paths } = registry;

console.log("\n── Loop Seed Cleanup ────────────────────────────────────────────────");
console.log(`  ${all_user_ids.length} users  ·  ${all_proof_post_ids.length} proofs  ·  ${all_night_ride_post_ids.length} night posts`);
console.log(`  Domain: ${SEED_DOMAIN}\n`);

async function deleteRows(table, column, ids, label) {
  if (!ids || ids.length === 0) { console.log(`  skip   ${label} (none in registry)`); return 0; }
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).in(column, ids);
  if (error) { console.error(`  FAILED ${label}: ${error.message}`); return 0; }
  console.log(`  deleted ${label}: ${count ?? "?"} rows`);
  return count ?? 0;
}

async function deleteStorageObjects(bucket, paths, label) {
  if (!paths || paths.length === 0) { console.log(`  skip   ${label} storage (none in registry)`); return; }
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) console.warn(`  WARN   ${label} storage partial error: ${error.message}`);
  else console.log(`  deleted ${label} storage: ${paths.length} objects`);
}

// Step 1 — Storage (before DB rows)
await deleteStorageObjects("alleycat-proofs", storage_paths["alleycat-proofs"], "alleycat-proofs");
await deleteStorageObjects("night-ride-posts", storage_paths["night-ride-posts"], "night-ride-posts");

// Step 2-9 — DB rows in FK-safe order
await deleteRows("messenger_proof_posts", "id", all_proof_post_ids, "messenger_proof_posts");
await deleteRows("messenger_run_checkins", "run_id", all_run_ids, "messenger_run_checkins");
await deleteRows("messenger_runs", "id", all_run_ids, "messenger_runs");
await deleteRows("messenger_manifests", "id", all_manifest_ids, "messenger_manifests");
await deleteRows("night_ride_posts", "id", all_night_ride_post_ids, "night_ride_posts");
await deleteRows("night_ride_sessions", "id", all_night_ride_session_ids, "night_ride_sessions");
await deleteRows("user_bikes", "user_id", all_user_ids, "user_bikes");
await deleteRows("user_profiles", "user_id", all_user_ids, "user_profiles");

// Step 10 — Auth users (cross-verify email domain before deleting)
console.log(`\n  deleting auth users...`);
let authDeleted = 0;
for (const userId of all_user_ids) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) { console.warn(`  WARN   getUserById(${userId}) failed: ${error.message}`); continue; }
  const email = data?.user?.email;
  if (!email?.endsWith(SEED_DOMAIN)) {
    console.warn(`  SKIP   ${userId} — email "${email}" is not a seed account (domain mismatch)`);
    continue;
  }
  const { error: delError } = await supabase.auth.admin.deleteUser(userId);
  if (delError) console.warn(`  WARN   deleteUser(${userId}) failed: ${delError.message}`);
  else authDeleted++;
}
console.log(`  deleted auth users: ${authDeleted}`);

// Archive registry
const archivePath = REGISTRY_PATH.replace("registry.json", `registry.cleaned-${Date.now()}.json`);
renameSync(REGISTRY_PATH, archivePath);
console.log(`\n✓ Cleanup complete`);
console.log(`  Registry archived → ${archivePath}`);
console.log(`  Run npm run admin:seed to re-seed if needed.\n`);
