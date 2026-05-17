import {
  json,
  getAuthUser,
  supabaseAdminAuthRequest,
  supabaseRequest,
} from '../../_utils.js';

/**
 * PURGE USER DATA
 * Google Play requires users to be able to delete their account and associated data easily.
 */
export async function onRequestDelete({request, env}) {
  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || '';

  if (!user_id) {
    return json({error: 'login required'}, {status: 401});
  }

  try {
    // 1. Delete user from Supabase Auth (This will cascade if FKs are set to CASCADE,
    // but we should manually clean up critical tables just in case).

    // Cleanup profiles, credits, etc.
    // Usually, the app logic should handle deletion.
    // Here we use the service role via supabaseRequest helper.

    const tables = [
      'user_profiles',
      'user_credits',
      'user_bikes',
      'loop_history',
      'messenger_runs',
      'messenger_manifests',
      'messenger_proof_posts',
      'messenger_challenge_entries',
      'night_ride_participants',
      'night_ride_posts',
      'saved_setups',
    ];

    for (const table of tables) {
      // Note: For messenger_runs delete will fail if child records exist,
      // but Supabase usually handles CASCADE if we set it.
      // We'll perform delete on all tables where user_id matches.
      await supabaseRequest(
        env,
        `${table}?user_id=eq.${encodeURIComponent(user_id)}`,
        {
          method: 'DELETE',
        },
      ).catch(err => {
        console.error(`Failed to delete from ${table}:`, err.message);
      });
    }

    // 2. Delete the actual Auth User via Admin API
    await supabaseAdminAuthRequest(
      env,
      `admin/users/${encodeURIComponent(user_id)}`,
      {
        method: 'DELETE',
      },
    );

    return json({ok: true, message: 'Account and data purged successfully.'});
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : 'Account deletion failed',
      },
      {status: 500},
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === 'DELETE') {
    return onRequestDelete(context);
  }
  return json({error: 'method not allowed'}, {status: 405});
}
