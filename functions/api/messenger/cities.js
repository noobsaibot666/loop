import {json, supabaseRequest} from '../../_utils.js';

export async function onRequest({env}) {
  const packs = await supabaseRequest(
    env,
    'city_packs?is_active=eq.true&select=name,slug&order=name.asc',
    {method: 'GET'},
  ).catch(() => null);

  // Return 503 on DB failure so the app knows to use its fallback rather than
  // treating an empty list as "no cities exist"
  if (packs === null) return json({error: 'cities unavailable'}, {status: 503});

  const cities = packs
    .filter(p => p.name && p.slug)
    .map(p => ({name: p.name, slug: p.slug}));

  return json({cities});
}
