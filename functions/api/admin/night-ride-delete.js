import {json, parseJSON, requireAdmin, supabaseRequest} from '../../_utils.js';

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  const body = await parseJSON(request);
  const postId = String(body.post_id || '').trim();

  if (!postId) return json({error: 'post_id required'}, {status: 400});

  const existingRows = await supabaseRequest(
    env,
    `night_ride_posts?id=eq.${encodeURIComponent(postId)}&select=id,rider_name,city_name,route_title`,
    {method: 'GET'},
  );
  const existing = existingRows?.[0] || null;
  if (!existing)
    return json({error: 'night ride post not found'}, {status: 404});

  await supabaseRequest(
    env,
    `night_ride_posts?id=eq.${encodeURIComponent(postId)}`,
    {method: 'DELETE'},
  );

  await supabaseRequest(env, 'moderation_action_history', {
    method: 'POST',
    headers: {
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      admin_user_id: admin.id || null,
      admin_email: admin.email || '',
      action: 'night_ride_delete',
      target_type: 'night_ride_post',
      target_id: postId,
      target_label: existing.route_title || existing.city_name || postId,
      details: {
        rider_name: existing.rider_name || '',
        city_name: existing.city_name || '',
        route_title: existing.route_title || '',
      },
    }),
  }).catch(() => null);

  return json({ok: true});
}
