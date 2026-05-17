import {json, supabaseRequest} from '../_utils.js';

const normalizeCitySlug = (value = '') =>
  String(value).trim().toLowerCase().replace(/\s+/g, '');
const normalizeCheckpointCount = (value = '') => {
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

// One post per run — deterministically take the most recent proof in the group.
// Rows arrive already sorted created_at desc so group[0] is always the newest.
const pickWallPosts = (rows = []) => {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = row.run_id || row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length === 40) break;
  }
  return out;
};

export async function onRequest({request, env}) {
  const url = new URL(request.url);
  const city = normalizeCitySlug(url.searchParams.get('city') || '');
  const checkpointCount = normalizeCheckpointCount(
    url.searchParams.get('checkpoint_count') || '',
  );
  const buildFilters = select => {
    const filters = [
      'is_public=eq.true',
      'archived_at=is.null',
      'order=created_at.desc',
      'limit=120',
      `select=${select}`,
    ];
    if (city) {
      filters.unshift(`city_slug=eq.${encodeURIComponent(city)}`);
    }
    return filters.join('&');
  };

  const SELECT =
    'id,run_id,manifest_id,user_id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at';
  const rows = await supabaseRequest(
    env,
    `messenger_proof_posts?${buildFilters(SELECT)}`,
    {method: 'GET'},
  ).catch(() => []);

  const manifestIds = [
    ...new Set((rows || []).map(row => row.manifest_id).filter(Boolean)),
  ];
  let manifests = [];
  if (manifestIds.length) {
    manifests = await supabaseRequest(
      env,
      `messenger_manifests?id=in.(${manifestIds.map(id => encodeURIComponent(id)).join(',')})&select=id,manifest_title,checkpoint_count`,
      {method: 'GET'},
    ).catch(() => []);
  }
  const manifestMap = new Map(
    (manifests || []).map(manifest => [manifest.id, manifest]),
  );
  const decoratedRows = (rows || [])
    .map(row => {
      const manifest = manifestMap.get(row.manifest_id);
      return {
        ...row,
        checkpoint_count: manifest?.checkpoint_count ?? null,
        manifest_title: manifest?.manifest_title || '',
      };
    })
    .filter(
      row =>
        !checkpointCount || Number(row.checkpoint_count) === checkpointCount,
    );

  return json({
    posts: pickWallPosts(decoratedRows),
  });
}
