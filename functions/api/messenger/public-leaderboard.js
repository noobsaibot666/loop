import { json, parseJSON } from "../../_utils.js";
import { onRequest as handleLeaderboard } from "../leaderboard.js";

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const body = await parseJSON(request);
  const nextUrl = new URL(request.url);
  if (body?.city) nextUrl.searchParams.set("city", String(body.city));
  if (body?.country) nextUrl.searchParams.set("country", String(body.country));
  if (body?.checkpoint_count) nextUrl.searchParams.set("checkpoint_count", String(body.checkpoint_count));

  const nextRequest = new Request(nextUrl.toString(), {
    method: "GET",
    headers: request.headers,
  });

  return handleLeaderboard({ ...context, request: nextRequest });
}
