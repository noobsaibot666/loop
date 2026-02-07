import { json } from "../_utils.js";

export async function onRequest() {
  return json({ ok: true });
}
