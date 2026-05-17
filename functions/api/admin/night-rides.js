import {json, requireAdmin, supabaseRequest} from '../../_utils.js';

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  const rows = await supabaseRequest(
    env,
    'night_ride_posts?select=id,user_id,rider_name,crew_name,city_name,route_title,distance_km,aspect_ratio,caption,image_url,created_at,moderation_status,is_public&order=created_at.desc&limit=50',
    {method: 'GET'},
  ).catch(() => []);

  return json({posts: rows});
}
