import {
  json,
  parseJSON,
  supabaseRequest,
  getAuthUser,
  isAdminEmail,
} from '../../_utils.js';

export async function onRequest({request, env}) {
  await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || '';

  if (!user_id) return json({error: 'login required'}, {status: 401});
  const isAdmin = isAdminEmail(env, authUser?.email || '');

  if (isAdmin) {
    return json({
      allowed: true,
      free_used: 0,
      donation_credits: 9999,
      credits_remaining: 9999,
      is_admin: true,
      unlimited_credits: true,
    });
  }

  // Enforce atomic consume via SQL function.
  try {
    const result = await supabaseRequest(env, 'rpc/consume_user_credit', {
      method: 'POST',
      body: JSON.stringify({
        p_user_id: user_id,
        p_free_limit: 3,
      }),
    });

    // Result from RPC is either the object direct or in an array
    const row = Array.isArray(result) ? result[0] : result;

    if (row && typeof row.allowed === 'boolean') {
      return json({
        allowed: row.allowed,
        free_used: row.free_used || 0,
        donation_credits: row.credits_remaining || 0,
        credits_remaining: row.credits_remaining || 0,
      });
    }

    return json({error: 'Invalid response from credit server'}, {status: 500});
  } catch (error) {
    console.error('Credit consumption failed:', error.message);
    return json(
      {error: `Credit consumption failed: ${error.message}`},
      {status: 500},
    );
  }
}
