import { json, parseJSON } from "../../_utils.js";
import { onRequest as handleCityRequest } from "../city-request.js";

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const body = await parseJSON(request);
  const nextRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      city: body?.city || body?.name || "",
      location: body?.location || "",
      note: body?.note || "",
      email: body?.email || "",
    }),
  });

  return handleCityRequest({ ...context, request: nextRequest });
}
