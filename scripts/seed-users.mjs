import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_DOMAIN = "@seed.hardchain.app";
const SEED_PASSWORD = "SeedRider!2026#Loop";
const REGISTRY_PATH = resolve(__dirname, "seed-data/registry.json");
const PHOTOS_PATH = resolve(__dirname, "seed-data/photos");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── City checkpoint pools ────────────────────────────────────────────────────

const CHECKPOINTS = {
  berlin: [
    { id: "berlin-alex-clock", name: "Alexanderplatz World Clock", lat: 52.521918, lng: 13.413215, district: "Mitte" },
    { id: "berlin-obernbaum", name: "Oberbaum Bridge", lat: 52.501775, lng: 13.446943, district: "Friedrichshain-Kreuzberg" },
    { id: "berlin-tempelhof", name: "Tempelhofer Feld Gate", lat: 52.473629, lng: 13.403419, district: "Tempelhof" },
    { id: "berlin-kotti", name: "Kottbusser Tor", lat: 52.4988, lng: 13.4184, district: "Kreuzberg" },
    { id: "berlin-mauerpark", name: "Mauerpark", lat: 52.5413, lng: 13.401, district: "Prenzlauer Berg" },
    { id: "berlin-maybachufer", name: "Maybachufer Market", lat: 52.4898, lng: 13.4274, district: "Neukölln" },
  ],
  newyork: [
    { id: "nyc-chinatown-cut", name: "Chinatown Canal Cut", lat: 40.7158, lng: -73.997, district: "Chinatown" },
    { id: "nyc-les-seam", name: "LES Market Seam", lat: 40.7189, lng: -73.9881, district: "Lower East Side" },
    { id: "nyc-east-village-grid", name: "East Village Grid", lat: 40.7282, lng: -73.9847, district: "East Village" },
    { id: "nyc-soho-backline", name: "SoHo Backline", lat: 40.7234, lng: -74.0027, district: "SoHo" },
    { id: "nyc-chelsea-rail-edge", name: "Chelsea Rail Edge", lat: 40.7475, lng: -74.0048, district: "Chelsea" },
    { id: "nyc-fidi-runup", name: "FiDi Run-Up", lat: 40.7062, lng: -74.0092, district: "Financial District" },
    { id: "nyc-dumbo-drop", name: "DUMBO Drop", lat: 40.7033, lng: -73.9891, district: "DUMBO" },
    { id: "nyc-williamsburg-grid", name: "Williamsburg Grid", lat: 40.7172, lng: -73.9576, district: "Williamsburg" },
  ],
  london: [
    { id: "london-waterloo", name: "Waterloo Station Arch", lat: 51.503334, lng: -0.113122, district: "Waterloo" },
    { id: "london-columbia-road", name: "Columbia Road", lat: 51.529274, lng: -0.071812, district: "Bethnal Green" },
    { id: "london-somerset", name: "Somerset House Courtyard", lat: 51.511463, lng: -0.117422, district: "Central London" },
    { id: "london-elephant-cut", name: "Elephant Arcade Edge", lat: 51.4948, lng: -0.1009, district: "Elephant and Castle" },
    { id: "london-soho", name: "Soho Cut", lat: 51.513, lng: -0.132, district: "Soho" },
  ],
  tokyo: [
    { id: "tokyo-shibuya-scramble", name: "Shibuya Scramble Edge", lat: 35.6595, lng: 139.7005, district: "Shibuya" },
    { id: "tokyo-nakameguro-tracks", name: "Nakameguro Under Tracks", lat: 35.6442, lng: 139.6986, district: "Meguro" },
    { id: "tokyo-koenji-north", name: "Koenji North Cut", lat: 35.7061, lng: 139.6492, district: "Suginami" },
    { id: "tokyo-akihabara-udx", name: "Akihabara UDX Edge", lat: 35.7006, lng: 139.772, district: "Chiyoda" },
    { id: "tokyo-yoyogi-entry", name: "Yoyogi Park South Gate", lat: 35.6673, lng: 139.6949, district: "Shibuya" },
  ],
  munich: [
    { id: "munich-marienplatz-cut", name: "Marienplatz Cut", lat: 48.1371, lng: 11.5754, district: "Altstadt" },
    { id: "munich-isar-line", name: "Isar Line", lat: 48.128, lng: 11.5885, district: "Au-Haidhausen" },
    { id: "munich-schwabing-grid", name: "Schwabing Grid", lat: 48.1618, lng: 11.5841, district: "Schwabing" },
  ],
};

const CITY_ORIGINS = {
  berlin:  { lat: 52.521918, lng: 13.413215, label: "Berlin Mitte" },
  newyork: { lat: 40.7158,   lng: -73.997,   label: "Lower Manhattan" },
  london:  { lat: 51.503334, lng: -0.113122, label: "Waterloo Bridge" },
  tokyo:   { lat: 35.6595,   lng: 139.7005,  label: "Shibuya" },
  munich:  { lat: 48.1371,   lng: 11.5754,   label: "Marienplatz" },
};

// ─── Seed rider definitions ───────────────────────────────────────────────────

// Proof counts are calibrated to the available photo pool:
// 12 alleycat photos → 12 total proofCount, 7 night photos → 7 total nightPostCount
const SEED_RIDERS = [
  {
    handle: "FelixKreuz", riderName: "Felix Kroll", gender: "male",
    email: "felix.kreuz@seed.hardchain.app",
    city: "Berlin", citySlug: "berlin",
    homeLocation: "Berlin",
    bikeName: "Masi Speciale Fixed", bikeRatio: "49×16",
    proofCount: 3, nightPostCount: 1, baseFinishSeconds: 2100,
    dayOffsets:    [2, 10, 22],
    nightDayOffsets: [14],
    runTitles: ["Kreuzberg Loop", "Mitte Sprint", "Mauerpark Push"],
  },
  {
    handle: "LenaWedding", riderName: "Lena Fischer", gender: "female",
    email: "lena.wedding@seed.hardchain.app",
    city: "Berlin", citySlug: "berlin",
    homeLocation: "Berlin",
    bikeName: "Quella Disc", bikeRatio: "46×16",
    proofCount: 2, nightPostCount: 1, baseFinishSeconds: 2400,
    dayOffsets:    [4, 18],
    nightDayOffsets: [6],
    runTitles: ["Kreuzberg Sprint", "Friedrichshain Loop"],
  },
  {
    handle: "MiriamBlix", riderName: "Miriam Nowak", gender: "female",
    email: "miriam.blix@seed.hardchain.app",
    city: "Berlin", citySlug: "berlin",
    homeLocation: "Berlin",
    bikeName: "Fuji Track", bikeRatio: "48×17",
    proofCount: 1, nightPostCount: 1, baseFinishSeconds: 2700,
    dayOffsets:    [9],
    nightDayOffsets: [20],
    runTitles: ["Kotti Loop"],
  },
  {
    handle: "TylerBoro", riderName: "Tyler James", gender: "male",
    email: "tyler.boro@seed.hardchain.app",
    city: "New York", citySlug: "newyork",
    homeLocation: "New York",
    bikeName: "Surly Steamroller", bikeRatio: "48×16",
    proofCount: 2, nightPostCount: 1, baseFinishSeconds: 2000,
    dayOffsets:    [3, 17],
    nightDayOffsets: [10],
    runTitles: ["Lower East Loop", "Chinatown Sprint"],
  },
  {
    handle: "ZoeyLower", riderName: "Zoey Chen", gender: "female",
    email: "zoey.lower@seed.hardchain.app",
    city: "New York", citySlug: "newyork",
    homeLocation: "New York",
    bikeName: "State Bicycle 6061", bikeRatio: "46×17",
    proofCount: 1, nightPostCount: 1, baseFinishSeconds: 2300,
    dayOffsets:    [11],
    nightDayOffsets: [24],
    runTitles: ["Bushwick Run"],
  },
  {
    handle: "MarcusHell", riderName: "Marcus Reid", gender: "male",
    email: "marcus.hell@seed.hardchain.app",
    city: "New York", citySlug: "newyork",
    homeLocation: "New York",
    bikeName: "Cinelli Tutto", bikeRatio: "48×15",
    proofCount: 1, nightPostCount: 0, baseFinishSeconds: 2600,
    dayOffsets:    [23],
    nightDayOffsets: [],
    runTitles: ["DUMBO Loop"],
  },
  {
    handle: "SophieRoad", riderName: "Sophie Clarke", gender: "female",
    email: "sophie.road@seed.hardchain.app",
    city: "London", citySlug: "london",
    homeLocation: "London",
    bikeName: "Charge Plug", bikeRatio: "46×16",
    proofCount: 1, nightPostCount: 1, baseFinishSeconds: 2350,
    dayOffsets:    [7],
    nightDayOffsets: [16],
    runTitles: ["Southwark Loop"],
  },
  {
    handle: "OllieBrick", riderName: "Ollie Nash", gender: "male",
    email: "ollie.brick@seed.hardchain.app",
    city: "London", citySlug: "london",
    homeLocation: "London",
    bikeName: "Windsor Hour", bikeRatio: "48×16",
    proofCount: 0, nightPostCount: 0, baseFinishSeconds: 2900,
    dayOffsets:    [],
    nightDayOffsets: [],
    runTitles: [],
  },
  {
    handle: "HarukaMachi", riderName: "Haruka Sato", gender: "female",
    email: "haruka.machi@seed.hardchain.app",
    city: "Tokyo", citySlug: "tokyo",
    homeLocation: "Tokyo",
    bikeName: "Leader 735TR", bikeRatio: "46×15",
    proofCount: 1, nightPostCount: 1, baseFinishSeconds: 2200,
    dayOffsets:    [13],
    nightDayOffsets: [26],
    runTitles: ["Shibuya Rush"],
  },
  {
    handle: "KaiFrank", riderName: "Kai Weber", gender: "male",
    email: "kai.frank@seed.hardchain.app",
    city: "Munich", citySlug: "munich",
    homeLocation: "Munich",
    bikeName: "Canyon Fixie", bikeRatio: "48×16",
    proofCount: 0, nightPostCount: 0, baseFinishSeconds: 2500,
    dayOffsets:    [],
    nightDayOffsets: [],
    runTitles: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seedTimestamp(dayOffset, hourSeed = 0) {
  const base = new Date("2026-05-01T00:00:00.000Z");
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(8 + (hourSeed % 12));
  base.setUTCMinutes((dayOffset * 7 + hourSeed * 13) % 60);
  return base.toISOString();
}

function nightTimestamp(dayOffset) {
  const base = new Date("2026-05-01T00:00:00.000Z");
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(21 + (dayOffset % 3));
  base.setUTCMinutes((dayOffset * 11) % 60);
  return base.toISOString();
}

function pickCheckpoints(citySlug, manifestIndex) {
  const pool = CHECKPOINTS[citySlug];
  const len = pool.length;
  return [
    pool[(manifestIndex * 3) % len],
    pool[(manifestIndex * 3 + 1) % len],
    pool[(manifestIndex * 3 + 2) % len],
  ];
}

function buildManifestJson(manifestId, rider, title, checkpoints, estimatedMinutes) {
  return {
    id: manifestId,
    city: rider.city,
    city_slug: rider.citySlug,
    manifest_title: title,
    checkpoint_count: 3,
    estimated_minutes: estimatedMinutes,
    checkpoints: checkpoints.map((cp) => ({
      id: cp.id,
      name: cp.name,
      lat: cp.lat,
      lng: cp.lng,
      district: cp.district,
    })),
  };
}

function photoPoolForBucket(bucket) {
  const rootDir = resolve(PHOTOS_PATH, bucket);
  const imageFilter = (f) => /\.(jpg|jpeg|png|webp)$/i.test(f);
  if (!existsSync(rootDir)) return [];
  // Collect from city subfolders first, then root files
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const fromSubdirs = entries.filter((e) => e.isDirectory()).flatMap((e) =>
    readdirSync(resolve(rootDir, e.name)).filter(imageFilter).map((f) => resolve(rootDir, e.name, f))
  );
  const fromRoot = entries.filter((e) => e.isFile() && imageFilter(e.name)).map((e) => resolve(rootDir, e.name));
  return [...fromSubdirs, ...fromRoot];
}

// Assign each rider an exclusive slice of the photo pool so no two riders share the same image.
// Riders with more proofs get proportionally larger slices. Within their slice, a rider
// cycles (repeats their own photos) but never touches another rider's photos.
function buildExclusivePhotoSlices(riders, bucket) {
  const pool = photoPoolForBucket(bucket);
  const slices = new Map();
  if (pool.length === 0) { riders.forEach((r) => slices.set(r.handle, [])); return slices; }

  // Sort riders by proof count descending so top riders get first pick
  const sorted = [...riders].sort((a, b) => b.proofCount - a.proofCount);
  let idx = 0;
  // First pass: 1 unique photo per rider
  for (const r of sorted) {
    slices.set(r.handle, [pool[idx % pool.length]]);
    idx++;
  }
  // Second pass: distribute remaining photos to riders (most-proofs-first)
  while (idx < pool.length) {
    for (const r of sorted) {
      if (idx >= pool.length) break;
      slices.get(r.handle).push(pool[idx]);
      idx++;
    }
  }
  return slices;
}

// Build gender pools once at startup, then assign by index within each gender.
// Files must contain "male" or "female" in the filename (e.g. male_01.jpg, female_portrait_3.png).
function buildAvatarPools() {
  const dir = resolve(PHOTOS_PATH, "avatars");
  if (!existsSync(dir)) return { male: [], female: [] };
  const files = readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const male = files.filter((f) => f.toLowerCase().includes("male") && !f.toLowerCase().includes("female")).map((f) => resolve(dir, f)).sort();
  const female = files.filter((f) => f.toLowerCase().includes("female")).map((f) => resolve(dir, f)).sort();
  return { male, female };
}

const AVATAR_POOLS = buildAvatarPools();
const AVATAR_GENDER_INDEX = { male: 0, female: 0 };

function avatarFileForRider(rider) {
  const pool = AVATAR_POOLS[rider.gender];
  if (!pool || pool.length === 0) return null;
  const idx = AVATAR_GENDER_INDEX[rider.gender]++;
  return pool[idx % pool.length];
}

function validatePhotos() {
  const buckets = ["alleycat-proofs", "night-ride-posts"];
  const missing = [];
  for (const bucket of buckets) {
    // Accept either city subfolders or a flat root pool — just need at least one image somewhere.
    const rootDir = resolve(PHOTOS_PATH, bucket);
    const allFiles = existsSync(rootDir)
      ? readdirSync(rootDir, { withFileTypes: true })
          .flatMap((e) => e.isDirectory()
            ? readdirSync(resolve(rootDir, e.name)).map((f) => resolve(rootDir, e.name, f))
            : [resolve(rootDir, e.name)])
          .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      : [];
    if (allFiles.length === 0) missing.push(`${bucket}/ (no images found in folder or any city subfolder)`);
  }
  // Avatars are optional — warn but don't block
  const maleCount = AVATAR_POOLS.male.length;
  const femaleCount = AVATAR_POOLS.female.length;
  if (maleCount === 0 || femaleCount === 0) {
    console.warn(`  warn  Avatar pool: ${maleCount} male, ${femaleCount} female photos found.`);
    console.warn(`        Add files containing "male" or "female" in their name to scripts/seed-data/photos/avatars/`);
    console.warn(`        e.g. male_01.jpg, female_02.png — seeding continues without avatars.\n`);
  } else {
    console.log(`  avatars  ${maleCount} male, ${femaleCount} female photos ready`);
  }
  if (missing.length > 0) {
    console.error("\nMissing photos — seed cannot start:");
    missing.forEach((m) => console.error(" ·", m));
    console.error("\nSource cycling photos from Unsplash (CC0) and place them in scripts/seed-data/photos/");
    console.error("Search: 'bicycle courier street', 'fixed gear urban', 'night cycling city'");
    process.exit(1);
  }
}

async function uploadPhoto(bucket, storagePath, filePath) {
  const folder = storagePath.split("/").slice(0, -1).join("/");
  const { data: existing } = await supabase.storage.from(bucket).list(folder);
  const fileName = storagePath.split("/").at(-1);
  if (existing && existing.find((f) => f.name === fileName)) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }
  const fileBuffer = readFileSync(filePath);
  const ext = filePath.split(".").at(-1).toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed (${storagePath}): ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

function nightRouteUrl(citySlug) {
  const o = CITY_ORIGINS[citySlug];
  return `https://www.google.com/maps/dir/${o.lat},${o.lng}/${o.lat + 0.01},${o.lng + 0.01}/`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("\n── Loop Seed Users ──────────────────────────────────────────────────");

validatePhotos();
console.log("✓ Photos validated");

// Load existing registry if present
const registry = existsSync(REGISTRY_PATH)
  ? JSON.parse(readFileSync(REGISTRY_PATH, "utf8"))
  : {
      created_at: new Date().toISOString(),
      seed_domain: SEED_DOMAIN,
      users: [],
      all_user_ids: [],
      all_manifest_ids: [],
      all_run_ids: [],
      all_proof_post_ids: [],
      all_night_ride_session_ids: [],
      all_night_ride_post_ids: [],
      storage_paths: { "alleycat-proofs": [], "night-ride-posts": [] },
    };

// Build map of existing seed emails
const { data: allUsersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) { console.error("listUsers failed:", listError.message); process.exit(1); }
const existingEmailMap = new Map(
  allUsersData.users
    .filter((u) => u.email?.endsWith(SEED_DOMAIN))
    .map((u) => [u.email, u.id])
);
console.log(`Found ${existingEmailMap.size} existing seed auth accounts`);

const existingRegistryIds = new Set(registry.all_user_ids);

// Alleycat proofs use a global sequential pool — each proof post gets a unique photo, no reuse ever
const alleycatPhotoPool = photoPoolForBucket("alleycat-proofs");
let alleycatPhotoIndex = 0;
const totalProofPosts = SEED_RIDERS.reduce((s, r) => s + r.proofCount, 0);
if (alleycatPhotoPool.length < totalProofPosts) {
  console.warn(`  warn  Alleycat photos: ${alleycatPhotoPool.length} available, ${totalProofPosts} needed.`);
  console.warn(`        Add ${totalProofPosts - alleycatPhotoPool.length} more photos to scripts/seed-data/photos/alleycat-proofs/ — proof posts without a unique photo will be skipped.\n`);
}

// Night posts use a single global sequential pool — each post gets a unique photo, no reuse ever
const nightPhotoPool = photoPoolForBucket("night-ride-posts");
let nightPhotoIndex = 0;
const totalNightPosts = SEED_RIDERS.reduce((s, r) => s + r.nightPostCount, 0);
if (nightPhotoPool.length < totalNightPosts) {
  console.warn(`  warn  Night photos: ${nightPhotoPool.length} available, ${totalNightPosts} needed.`);
  console.warn(`        Add more photos to scripts/seed-data/photos/night-ride-posts/ — posts without a unique photo will be skipped.\n`);
}

for (const rider of SEED_RIDERS) {
  const already = registry.users.find((u) => u.email === rider.email);
  if (already && existingRegistryIds.has(already.user_id)) {
    console.log(`  skip  ${rider.handle} — already in registry`);
    continue;
  }

  console.log(`\n  seed  ${rider.handle} (${rider.city})`);

  // Phase 2 — Auth user
  let userId;
  if (existingEmailMap.has(rider.email)) {
    userId = existingEmailMap.get(rider.email);
    console.log(`    auth   exists (${userId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: rider.email, password: SEED_PASSWORD, email_confirm: true,
    });
    if (error) { console.error(`    auth   FAILED: ${error.message}`); process.exit(1); }
    userId = data.user.id;
    console.log(`    auth   created (${userId})`);
  }

  // Phase 3 — Avatar upload (optional)
  let avatarUrl = null;
  const avatarFile = avatarFileForRider(rider);
  if (avatarFile) {
    const ext = avatarFile.split(".").at(-1).toLowerCase();
    const avatarStoragePath = `avatars/${userId}/avatar.${ext}`;
    try {
      avatarUrl = await uploadPhoto("alleycat-proofs", avatarStoragePath, avatarFile);
      if (!registry.storage_paths["alleycat-proofs"].includes(avatarStoragePath)) {
        registry.storage_paths["alleycat-proofs"].push(avatarStoragePath);
      }
      console.log(`    avatar uploaded`);
    } catch (e) {
      console.warn(`    avatar upload skipped: ${e.message}`);
    }
  }

  // Phase 3 — Profile
  const { error: profileError } = await supabase.from("user_profiles").upsert(
    { user_id: userId, rider_name: rider.riderName, home_location: rider.homeLocation,
      bike_name: rider.bikeName, bike_ratio: rider.bikeRatio,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}) },
    { onConflict: "user_id" }
  );
  if (profileError) { console.error(`    profile FAILED: ${profileError.message}`); process.exit(1); }

  const { data: existingBikes } = await supabase.from("user_bikes").select("id").eq("user_id", userId).limit(1);
  let bikeId;
  if (existingBikes && existingBikes.length > 0) {
    bikeId = existingBikes[0].id;
  } else {
    const { data: bikeData, error: bikeError } = await supabase.from("user_bikes").insert(
      { user_id: userId, bike_name: rider.bikeName, bike_ratio: rider.bikeRatio, is_default: true, sort_order: 0 }
    ).select("id").single();
    if (bikeError) { console.error(`    bikes  FAILED: ${bikeError.message}`); process.exit(1); }
    bikeId = bikeData.id;
  }
  console.log(`    profile + bike saved`);

  const userEntry = { email: rider.email, user_id: userId, bike_id: bikeId,
    manifest_ids: [], run_ids: [], proof_post_ids: [],
    night_ride_session_ids: [], night_ride_post_ids: [] };

  const alleycatStoragePaths = [];

  // Phases 4-6 — Manifests, runs, proof posts
  for (let i = 0; i < rider.proofCount; i++) {
    const manifestId = randomUUID();
    const runId = randomUUID();
    const proofId = randomUUID();
    const checkpoints = pickCheckpoints(rider.citySlug, i);
    const title = rider.runTitles[i];
    const estimatedMinutes = 35 + (i * 5) % 25;
    const manifestJson = buildManifestJson(manifestId, rider, title, checkpoints, estimatedMinutes);
    const dayOffset = rider.dayOffsets[i];
    const startedAt = seedTimestamp(dayOffset, i);
    const finishSeconds = rider.baseFinishSeconds + (i * 113) % 600;
    const finishedAt = new Date(new Date(startedAt).getTime() + finishSeconds * 1000).toISOString();

    // Manifest
    const { error: manifestError } = await supabase.from("messenger_manifests").insert({
      id: manifestId, user_id: userId, city_slug: rider.citySlug, city_name: rider.city,
      difficulty: "medium", style: "local", manifest_title: title,
      estimated_minutes: estimatedMinutes, ghost_seconds: null, checkpoint_count: 3,
      manifest: manifestJson, created_at: startedAt,
    });
    if (manifestError) { console.error(`    manifest FAILED (${title}): ${manifestError.message}`); process.exit(1); }

    // Run
    const { error: runError } = await supabase.from("messenger_runs").insert({
      id: runId, manifest_id: manifestId, user_id: userId,
      bike_id: bikeId, bike_name: rider.bikeName, bike_ratio: rider.bikeRatio,
      status: "finished", started_at: startedAt, finished_at: finishedAt,
      finish_seconds: finishSeconds, created_at: startedAt,
    });
    if (runError) { console.error(`    run FAILED (${title}): ${runError.message}`); process.exit(1); }

    // Photo upload — skip this proof if pool is exhausted (no reuse)
    const alleycatPhotoFile = alleycatPhotoPool[alleycatPhotoIndex];
    if (!alleycatPhotoFile) {
      console.warn(`    proof skipped — alleycat photo pool exhausted (add more photos)`);
      continue;
    }
    alleycatPhotoIndex++;
    const photoExt = alleycatPhotoFile.split(".").at(-1).toLowerCase();
    const storagePath = `${userId}/${runId}/cp-seed-1.${photoExt}`;
    const publicUrl = await uploadPhoto("alleycat-proofs", storagePath, alleycatPhotoFile);
    alleycatStoragePaths.push(storagePath);

    // Proof post
    const cp = checkpoints[0];
    const { error: proofError } = await supabase.from("messenger_proof_posts").insert({
      id: proofId, user_id: userId, run_id: runId, manifest_id: manifestId,
      checkpoint_id: cp.id, checkpoint_name: cp.name,
      city_slug: rider.citySlug, city_name: rider.city,
      rider_name: rider.riderName, media_type: "image",
      storage_path: storagePath, public_url: publicUrl,
      location_label: cp.district,
      bike_name: rider.bikeName, bike_ratio: rider.bikeRatio,
      is_public: true, archived_at: null, created_at: finishedAt,
    });
    if (proofError) { console.error(`    proof FAILED (${title}): ${proofError.message}`); process.exit(1); }

    userEntry.manifest_ids.push(manifestId);
    userEntry.run_ids.push(runId);
    userEntry.proof_post_ids.push(proofId);
  }
  console.log(`    ${rider.proofCount} manifests + runs + proofs created`);

  // Phase 7 — Night rides
  const nightStoragePaths = [];

  for (let n = 0; n < rider.nightPostCount; n++) {
    const sessionId = randomUUID();
    const postId = randomUUID();
    const dayOffset = rider.nightDayOffsets[n];
    const createdAt = nightTimestamp(dayOffset);
    const shareCode = `SD${randomUUID().slice(0, 6).toUpperCase().replace(/-/g, "")}`;
    const origin = CITY_ORIGINS[rider.citySlug];

    const { error: sessionError } = await supabase.from("night_ride_sessions").insert({
      id: sessionId, creator_user_id: userId,
      creator_rider_name: rider.riderName,
      session_type: "crew", mode: "loop",
      title: `${rider.city} Hard Chain Loop`,
      difficulty: "medium", unit: "km", distance_km: 25,
      bike_id: bikeId, bike_name: rider.bikeName, bike_ratio: rider.bikeRatio,
      ride_city: rider.city, crew_name: "Hard Chain",
      crew_members: [],
      origin_label: origin.label, origin_lat: origin.lat, origin_lng: origin.lng,
      destination_label: null, destination_lat: null, destination_lng: null,
      share_code: shareCode,
      route_url: nightRouteUrl(rider.citySlug),
      route_payload: {},
      status: "open", created_at: createdAt,
    });
    if (sessionError) { console.error(`    night session FAILED: ${sessionError.message}`); process.exit(1); }

    const nightPhotoFile = nightPhotoPool[nightPhotoIndex];
    if (!nightPhotoFile) {
      console.warn(`    night post skipped — photo pool exhausted (add more to night-ride-posts/)`);
    } else {
      nightPhotoIndex++;
      const photoExt = nightPhotoFile.split(".").at(-1).toLowerCase();
      const storagePath = `${userId}/${sessionId}/nr-seed-${n + 1}.${photoExt}`;
      const imageUrl = await uploadPhoto("night-ride-posts", storagePath, nightPhotoFile);
      nightStoragePaths.push(storagePath);

      const { error: postError } = await supabase.from("night_ride_posts").insert({
        id: postId, session_id: sessionId, user_id: userId,
        rider_name: rider.riderName, crew_name: "Hard Chain",
        city_name: rider.city, route_title: `${rider.city} Hard Chain Loop`,
        distance_km: 25,
        bike_name: rider.bikeName, bike_ratio: rider.bikeRatio,
        caption: `Night out in ${rider.city}. Still moving.`,
        storage_path: storagePath, image_url: imageUrl,
        aspect_ratio: "16:9", is_public: true, moderation_status: "live",
        created_at: createdAt,
      });
      if (postError) { console.error(`    night post FAILED: ${postError.message}`); process.exit(1); }

      userEntry.night_ride_session_ids.push(sessionId);
      userEntry.night_ride_post_ids.push(postId);
    }
  }
  if (rider.nightPostCount > 0) console.log(`    ${rider.nightPostCount} night ride sessions + posts created`);

  // Update registry
  registry.users.push(userEntry);
  registry.all_user_ids.push(userId);
  registry.all_manifest_ids.push(...userEntry.manifest_ids);
  registry.all_run_ids.push(...userEntry.run_ids);
  registry.all_proof_post_ids.push(...userEntry.proof_post_ids);
  registry.all_night_ride_session_ids.push(...userEntry.night_ride_session_ids);
  registry.all_night_ride_post_ids.push(...userEntry.night_ride_post_ids);
  registry.storage_paths["alleycat-proofs"].push(...alleycatStoragePaths);
  registry.storage_paths["night-ride-posts"].push(...nightStoragePaths);

  // Write registry after each rider (incremental safety)
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const totalProofs = registry.all_proof_post_ids.length;
const totalNight = registry.all_night_ride_post_ids.length;
const totalUsers = registry.all_user_ids.length;

console.log(`\n✓ Seed complete`);
console.log(`  ${totalUsers} riders  ·  ${totalProofs} proof posts  ·  ${totalNight} night posts`);
console.log(`  Registry: scripts/seed-data/registry.json`);
console.log(`\nVerify:`);
console.log(`  Leaderboard → /leaderboard (should show ${totalUsers} seed riders)`);
console.log(`  Wall        → /wall (should show ${totalProofs} proof posts)`);
console.log(`  Night Wall  → /wall (Night tab, should show ${totalNight} posts)`);
console.log(`\nTo remove all seed data: npm run admin:seed:clean\n`);
