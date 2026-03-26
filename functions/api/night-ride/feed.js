import { json, parseJSON } from "../../_utils.js";
import { onRequest as handleNightRideFeed } from "../night-rides/feed.js";

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const body = await parseJSON(request);
  const nextUrl = new URL(request.url);
  if (body?.city) nextUrl.searchParams.set("city", String(body.city));

  const nextRequest = new Request(nextUrl.toString(), {
    method: "GET",
    headers: request.headers,
  });

  return handleNightRideFeed({ ...context, request: nextRequest });
}
