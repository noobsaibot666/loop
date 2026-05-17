import {json, supabaseRequest} from '../../_utils.js';
import {MESSENGER_TABLES} from './_helpers.js';

const MAX_GROUPS = 12;

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  // 1. Recent challenges
  const challenges = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.challenges}?order=created_at.desc&limit=${MAX_GROUPS * 3}&select=id,code,created_at`,
    {method: 'GET'},
  ).catch(() => []);

  if (!challenges?.length) return json({groups: []});

  const challengeIds = challenges.map(c => c.id);

  // 2. All entries for those challenges
  const entries = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.challengeEntries}?challenge_id=in.(${challengeIds.map(encodeURIComponent).join(',')})&order=joined_at.asc&select=challenge_id,manifest_id,user_id,joined_at`,
    {method: 'GET'},
  ).catch(() => []);

  if (!entries?.length) return json({groups: []});

  const manifestIds = [
    ...new Set((entries || []).map(e => e.manifest_id).filter(Boolean)),
  ];
  if (!manifestIds.length) return json({groups: []});

  // 3. Manifests (title + city for display)
  const manifests = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.manifests}?id=in.(${manifestIds.map(encodeURIComponent).join(',')})&select=id,manifest_title,city_name,checkpoint_count`,
    {method: 'GET'},
  ).catch(() => []);

  // 4. Public photo proofs for those manifests
  const proofs = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.proofs}?manifest_id=in.(${manifestIds.map(encodeURIComponent).join(',')})&is_public=eq.true&order=created_at.asc&select=id,manifest_id,checkpoint_name,public_url,created_at,rider_name`,
    {method: 'GET'},
  ).catch(() => []);

  // 5. Finished runs for timing
  const runs = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.runs}?manifest_id=in.(${manifestIds.map(encodeURIComponent).join(',')})&status=eq.finished&select=manifest_id,user_id,finish_seconds`,
    {method: 'GET'},
  ).catch(() => []);

  // Build lookup maps
  const manifestMap = new Map((manifests || []).map(m => [m.id, m]));

  const proofsByManifest = {};
  for (const proof of proofs || []) {
    if (!proofsByManifest[proof.manifest_id])
      proofsByManifest[proof.manifest_id] = [];
    proofsByManifest[proof.manifest_id].push(proof);
  }

  const bestTimeByManifest = {};
  for (const run of runs || []) {
    const prev = bestTimeByManifest[run.manifest_id];
    if (prev === undefined || run.finish_seconds < prev) {
      bestTimeByManifest[run.manifest_id] = run.finish_seconds;
    }
  }

  const entriesByChallenge = {};
  for (const entry of entries || []) {
    if (!entriesByChallenge[entry.challenge_id])
      entriesByChallenge[entry.challenge_id] = [];
    entriesByChallenge[entry.challenge_id].push(entry);
  }

  // Assemble groups
  const groups = [];

  for (const challenge of challenges) {
    const challengeEntries = entriesByChallenge[challenge.id] || [];
    if (!challengeEntries.length) continue;

    // Use first entry's manifest for ride metadata
    const refManifestId = challengeEntries[0]?.manifest_id;
    const manifest = manifestMap.get(refManifestId);
    if (!manifest) continue;

    const riders = challengeEntries.map(entry => {
      const manifestProofs = proofsByManifest[entry.manifest_id] || [];
      const riderName = manifestProofs[0]?.rider_name || 'Rider';
      return {
        user_id: entry.user_id,
        rider_name: riderName,
        finish_seconds: bestTimeByManifest[entry.manifest_id] ?? null,
        proofs: manifestProofs.map(p => ({
          id: p.id,
          checkpoint_name: p.checkpoint_name,
          public_url: p.public_url,
          created_at: p.created_at,
        })),
      };
    });

    // Skip groups with no proof photos
    if (!riders.some(r => r.proofs.length > 0)) continue;

    groups.push({
      challenge_id: challenge.id,
      code: challenge.code,
      manifest_title: manifest.manifest_title,
      city_name: manifest.city_name,
      checkpoint_count: manifest.checkpoint_count ?? null,
      created_at: challenge.created_at,
      rider_count: challengeEntries.length,
      riders,
    });

    if (groups.length >= MAX_GROUPS) break;
  }

  return json({groups});
}
