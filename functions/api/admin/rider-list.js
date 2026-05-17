import {json, requireAdmin, supabaseRequest, requireEnv} from '../../_utils.js';

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  try {
    const [credits, profiles] = await Promise.all([
      supabaseRequest(
        env,
        'user_credits?select=user_id,credits,free_used,updated_at&order=updated_at.desc',
        {method: 'GET'},
      ),
      supabaseRequest(env, 'user_profiles?select=user_id,rider_name', {
        method: 'GET',
      }),
    ]);

    // Fetch auth emails - manual fetch since supabaseRequest targets /rest/v1/
    const url = requireEnv(env, 'SUPABASE_URL');
    const key = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');

    const authRes = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    let authData = {users: []};
    if (authRes.ok) {
      authData = await authRes.json();
    } else {
      console.error('Admin rider-list auth error status:', authRes.status);
    }

    const authUsers = authData?.users || [];
    const emailMap = new Map(authUsers.map(u => [u.id, u.email]));
    const nameMap = new Map(
      (profiles || []).map(p => [p.user_id, p.rider_name]),
    );
    const creditMap = new Map((credits || []).map(row => [row.user_id, row]));

    const riders = authUsers
      .map(authUser => {
        const creditRow = creditMap.get(authUser.id);
        return {
          user_id: authUser.id,
          email: authUser.email || 'unknown',
          rider_name: nameMap.get(authUser.id) || '',
          credits: creditRow?.credits || 0,
          free_used: creditRow?.free_used || 0,
          updated_at:
            creditRow?.updated_at ||
            authUser.created_at ||
            authUser.last_sign_in_at ||
            null,
        };
      })
      .sort((left, right) =>
        String(right.updated_at || '').localeCompare(
          String(left.updated_at || ''),
        ),
      );

    return json({ok: true, riders});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
