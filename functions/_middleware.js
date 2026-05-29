const getAllowedOrigin = ({request, env}) => {
  const origin = request.headers.get('Origin') || '';
  if (!origin) return '';

  const requestOrigin = new URL(request.url).origin;
  const configured = (env?.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([requestOrigin, ...configured]);
  return allowedOrigins.has(origin) ? origin : '';
};

const applyCorsHeaders = (headers, allowedOrigin) => {
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Vary', 'Origin');
  }
  headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, apikey',
  );
  headers.set('Access-Control-Max-Age', '86400');
};

export async function onRequest(context) {
  const allowedOrigin = getAllowedOrigin(context);

  if (context.request.method === 'OPTIONS') {
    const headers = new Headers();
    applyCorsHeaders(headers, allowedOrigin);
    return new Response(null, {
      status: allowedOrigin ? 204 : 403,
      headers,
    });
  }

  const response = await context.next();
  applyCorsHeaders(response.headers, allowedOrigin);

  return response;
}
