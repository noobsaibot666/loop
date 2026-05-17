import Stripe from 'stripe';
import {getAuthUser, json, requireEnv, supabaseRequest} from '../../_utils.js';

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({error: 'auth required'}, {status: 401});

  const rows = await supabaseRequest(
    env,
    `community_memberships?user_id=eq.${encodeURIComponent(authUser.id)}&select=*&limit=1`,
    {method: 'GET'},
  ).catch(() => []);
  const membership = rows?.[0] || null;
  if (!membership) return json({error: 'membership not found'}, {status: 404});

  const stripeSecret = requireEnv(env, 'STRIPE_SECRET_KEY');
  const stripe = new Stripe(stripeSecret, {apiVersion: '2024-06-20'});

  let customerId = membership.stripe_customer_id || null;
  if (!customerId && membership.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        membership.stripe_subscription_id,
      );
      customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id || null;
      if (customerId) {
        await supabaseRequest(env, 'community_memberships', {
          method: 'POST',
          headers: {Prefer: 'resolution=merge-duplicates'},
          body: JSON.stringify({
            ...membership,
            stripe_customer_id: customerId,
          }),
        }).catch(() => null);
      }
    } catch (error) {
      return json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not resolve subscription customer',
        },
        {status: 500},
      );
    }
  }

  if (!customerId)
    return json({error: 'customer portal unavailable'}, {status: 400});

  const appUrl = new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`,
  });

  return json({ok: true, url: session.url});
}
