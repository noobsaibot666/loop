import {json, parseJSON, requireAdmin, requireEnv} from '../../_utils.js';
import {
  buildCheckpointDraftPrompt,
  buildPackDraftPrompt,
  callOpenAIJson,
  checkpointDraftSchema,
  packDraftSchema,
} from '../../../shared/ai.js';

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  const body = await parseJSON(request);
  const apiKey = requireEnv(env, 'OPENAI_API_KEY');
  const kind = String(body.kind || '').trim();

  if (kind === 'checkpoint') {
    const draft = await callOpenAIJson({
      apiKey,
      model: env.OPENAI_MODEL || undefined,
      schemaName: 'alleycat_checkpoint_draft',
      schema: checkpointDraftSchema,
      userPrompt: buildCheckpointDraftPrompt(body),
    });
    return json({ok: true, kind, draft});
  }

  if (kind === 'pack') {
    const draft = await callOpenAIJson({
      apiKey,
      model: env.OPENAI_MODEL || undefined,
      schemaName: 'alleycat_pack_draft',
      schema: packDraftSchema,
      userPrompt: buildPackDraftPrompt(body),
    });
    return json({ok: true, kind, draft});
  }

  return json({error: 'kind must be checkpoint or pack'}, {status: 400});
}
