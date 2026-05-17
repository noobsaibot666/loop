import {json, supabaseRequest} from '../_utils.js';

const normalizeCityKey = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, '');

const titleCaseCity = (value = '') =>
  String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export async function onRequest({env}) {
  const rows = await supabaseRequest(
    env,
    'city_requests?select=requested_city,requested_location,status,created_at&order=created_at.desc&limit=200',
    {method: 'GET'},
  ).catch(() => []);

  const counts = new Map();
  let openRequests = 0;
  let queuedRequests = 0;

  for (const row of rows || []) {
    const cityKey = normalizeCityKey(
      row.requested_city || row.requested_location || '',
    );
    if (!cityKey) continue;
    const current = counts.get(cityKey) || {
      city: titleCaseCity(cityKey),
      count: 0,
    };
    current.count += 1;
    counts.set(cityKey, current);

    if (row.status !== 'done') openRequests += 1;
    if (row.status === 'queued') queuedRequests += 1;
  }

  const topCities = [...counts.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, 5);

  return json({
    total_requests: (rows || []).length,
    open_requests: openRequests,
    queued_requests: queuedRequests,
    top_cities: topCities,
  });
}
