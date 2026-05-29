import assert from 'node:assert/strict';
import {test} from 'node:test';
import {onRequest} from './create-checkout-session.js';

const env = {
  STRIPE_SECRET_KEY: 'sk_test_123',
  SUPABASE_URL: 'https://supabase.example',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
};

test('checkout redirects are constrained to the current origin', async () => {
  const fetchCalls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    fetchCalls.push({url: String(url), options});
    if (String(url).includes('/auth/v1/user')) {
      return Response.json({id: 'user-1', email: 'rider@example.com'});
    }
    if (String(url).includes('api.stripe.com')) {
      return Response.json({id: 'cs_test_123', url: 'https://checkout.stripe.test'});
    }
    return Response.json({});
  };

  try {
    const request = new Request('https://loop.example/api/create-checkout-session', {
      method: 'POST',
      headers: {Authorization: 'Bearer token'},
      body: JSON.stringify({
        amount: 500,
        success_redirect_to: 'https://evil.example/success',
        cancel_redirect_to: '//evil.example/cancel',
      }),
    });

    await onRequest({request, env});

    const stripeCall = fetchCalls.find(call =>
      call.url.includes('api.stripe.com/v1/checkout/sessions'),
    );
    assert.ok(stripeCall);
    const body = String(stripeCall.options.body);
    assert.match(
      body,
      /success_url=https%3A%2F%2Floop\.example%2F%3Fdonation%3Dsuccess%26session_id%3D%7BCHECKOUT_SESSION_ID%7D/,
    );
    assert.match(body, /cancel_url=https%3A%2F%2Floop\.example%2F%3Fdonation%3Dcancel/);
    assert.doesNotMatch(body, /evil\.example/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
