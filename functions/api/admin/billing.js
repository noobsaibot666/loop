import {json, requireAdmin, supabaseRequest} from '../../_utils.js';

export async function onRequest({request, env}) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({error: 'unauthorized'}, {status: 401});

  const [purchaseEvents, productCatalog, stripeSessions, userCredits] =
    await Promise.all([
      supabaseRequest(
        env,
        'mobile_purchase_events?select=event_id,user_id,store_product_id,event_type,platform,store,environment,amount_cents,currency,credits_to_grant,status,purchased_at,created_at&order=created_at.desc&limit=30',
        {method: 'GET'},
      ).catch(() => []),
      supabaseRequest(
        env,
        'mobile_product_catalog?select=store_product_id,display_name,credits_to_grant,price_cents,currency,is_active,offering_id&order=price_cents.asc',
        {method: 'GET'},
      ).catch(() => []),
      supabaseRequest(
        env,
        'stripe_sessions?select=session_id,user_id,status,amount_cents,credits_to_grant,created_at&order=created_at.desc&limit=20',
        {method: 'GET'},
      ).catch(() => []),
      supabaseRequest(
        env,
        'user_credits?select=user_id,credits,free_used,updated_at&order=updated_at.desc',
        {method: 'GET'},
      ).catch(() => []),
    ]);

  const creditsArray = Array.isArray(userCredits) ? userCredits : [];
  const zeroCreditsRiders = creditsArray.filter(r => (r.credits || 0) === 0);
  const totalIapCreditsGranted = Array.isArray(purchaseEvents)
    ? purchaseEvents
        .filter(e => e.status === 'credited')
        .reduce((sum, e) => sum + Number(e.credits_to_grant || 0), 0)
    : 0;
  const totalIapRevenueCents = Array.isArray(purchaseEvents)
    ? purchaseEvents
        .filter(e => e.status === 'credited')
        .reduce((sum, e) => sum + Number(e.amount_cents || 0), 0)
    : 0;
  const totalStripeRevenueCents = Array.isArray(stripeSessions)
    ? stripeSessions
        .filter(s => s.status === 'credited' || s.status === 'complete')
        .reduce((sum, s) => sum + Number(s.amount_cents || 0), 0)
    : 0;

  return json({
    purchase_events: Array.isArray(purchaseEvents) ? purchaseEvents : [],
    product_catalog: Array.isArray(productCatalog) ? productCatalog : [],
    stripe_sessions: Array.isArray(stripeSessions) ? stripeSessions : [],
    zero_credits_riders: zeroCreditsRiders.slice(0, 50),
    metrics: {
      iap_purchases_total: Array.isArray(purchaseEvents)
        ? purchaseEvents.filter(e => e.status === 'credited').length
        : 0,
      iap_credits_granted: totalIapCreditsGranted,
      iap_revenue_cents: totalIapRevenueCents,
      stripe_revenue_cents: totalStripeRevenueCents,
      zero_credits_count: zeroCreditsRiders.length,
      product_catalog_seeded:
        Array.isArray(productCatalog) && productCatalog.length > 0,
    },
  });
}
