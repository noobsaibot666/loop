import {json, requireAdmin, supabaseRequest} from '../../_utils.js';

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  const rows = await supabaseRequest(
    env,
    'messenger_proof_posts?select=id,rider_name,city_name,checkpoint_name,is_public,created_at,public_url,storage_path,archived_at&order=created_at.desc&limit=250',
    {method: 'GET'},
  );

  return json({proofs: rows || []});
}
