// Relay for mobile OAuth. After Supabase processes the Apple/Google callback it redirects here.
// We immediately redirect to the loop:// deep link so ASWebAuthenticationSession can intercept
// the custom scheme and close the auth browser cleanly on all devices including iPad.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  return Response.redirect(`loop://auth/callback${url.search}`, 302);
}
