import {json, supabaseRequest} from '../../_utils.js';

export async function onRequest({env}) {
  const packs = await supabaseRequest(
    env,
    'city_packs?is_active=eq.true&select=name,slug&order=created_at.desc&limit=6',
    {method: 'GET'},
  ).catch(() => null);

  if (packs === null) return json({cities: []});

  const cities = (packs || [])
    .filter(p => p.name && p.slug)
    .map(p => ({label: p.name, slug: p.slug}));

  return json({cities});
}
