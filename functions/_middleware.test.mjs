import assert from 'node:assert/strict';
import {test} from 'node:test';
import {onRequest} from './_middleware.js';

test('CORS allows the request origin and rejects unknown preflights', async () => {
  const allowed = await onRequest({
    env: {},
    request: new Request('https://loop.example/api/health', {
      method: 'OPTIONS',
      headers: {Origin: 'https://loop.example'},
    }),
    next: async () => Response.json({ok: true}),
  });
  assert.equal(allowed.status, 204);
  assert.equal(
    allowed.headers.get('Access-Control-Allow-Origin'),
    'https://loop.example',
  );

  const rejected = await onRequest({
    env: {},
    request: new Request('https://loop.example/api/health', {
      method: 'OPTIONS',
      headers: {Origin: 'https://evil.example'},
    }),
    next: async () => Response.json({ok: true}),
  });
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get('Access-Control-Allow-Origin'), null);
});
