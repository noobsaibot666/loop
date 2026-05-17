import {json, parseJSON, requireAdmin, supabaseRequest} from '../../_utils.js';

const parseMonthWindow = (value = '') => {
  const match = String(value).match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return {start, end};
};

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  const body = await parseJSON(request);
  const month = String(body.month || '').trim();
  const window = parseMonthWindow(month);
  if (!window) return json({error: 'month must be YYYY-MM'}, {status: 400});

  const updated = await supabaseRequest(
    env,
    `messenger_proof_posts?created_at=gte.${encodeURIComponent(window.start.toISOString())}&created_at=lt.${encodeURIComponent(
      window.end.toISOString(),
    )}&archived_at=is.null`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        archived_at: new Date().toISOString(),
      }),
    },
  );

  await supabaseRequest(env, 'moderation_action_history', {
    method: 'POST',
    headers: {
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      admin_user_id: admin.id || null,
      admin_email: admin.email || '',
      action: 'proof_archive_month',
      target_type: 'proof_month',
      target_id: month,
      target_label: month,
      details: {
        month,
        archived_count: updated?.length || 0,
      },
    }),
  }).catch(() => null);

  return json({
    ok: true,
    archived: updated?.length || 0,
    month,
  });
}
