export const COMMUNITY_INVITE_URL = 'https://discord.gg/2wWFKuQ7';
export const COMMUNITY_PLAN_CODE = 'discord_access';
export const COMMUNITY_PRICE_CENTS = 500;
export const COMMUNITY_CURRENCY = 'usd';
export const COMMUNITY_INTERVAL = 'month';
export const COMMUNITY_DISCORD_LINK_TTL_MINUTES = 15;

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export const toIsoOrNull = value => {
  if (!value) return null;
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const isMembershipActive = (membership, now = Date.now()) => {
  if (!membership) return false;
  if (!ACTIVE_STATUSES.has(String(membership.status || '').toLowerCase()))
    return false;
  if (!membership.current_period_end) return true;
  const periodEnd = new Date(membership.current_period_end).getTime();
  return Number.isFinite(periodEnd) ? periodEnd > now : true;
};

export const deriveMembershipAccessState = (membership, now = Date.now()) => {
  if (!membership) return 'inactive';
  if (isMembershipActive(membership, now)) {
    return membership.cancel_at_period_end ? 'ending' : 'active';
  }
  const status = String(membership.status || '').toLowerCase();
  if (!status || status === 'pending' || status === 'checkout_created')
    return 'pending';
  if (
    status === 'canceled' ||
    status === 'incomplete_expired' ||
    status === 'unpaid'
  )
    return 'inactive';
  return 'restricted';
};

export const sanitizeMembershipForClient = membership => {
  if (!membership) return null;
  const discordLinked = Boolean(membership.discord_user_id);
  return {
    user_id: membership.user_id,
    plan_code: membership.plan_code || COMMUNITY_PLAN_CODE,
    status: membership.status || 'pending',
    price_cents: membership.price_cents ?? COMMUNITY_PRICE_CENTS,
    currency: membership.currency || COMMUNITY_CURRENCY,
    interval: membership.interval || COMMUNITY_INTERVAL,
    current_period_end: membership.current_period_end || null,
    cancel_at_period_end: Boolean(membership.cancel_at_period_end),
    access_state: deriveMembershipAccessState(membership),
    access_active: isMembershipActive(membership),
    has_invite: Boolean(membership.discord_invite_url),
    discord_linked: discordLinked,
    discord_username: membership.discord_username || null,
    discord_role_status: membership.discord_role_status || null,
    discord_access_granted_at: membership.discord_access_granted_at || null,
    discord_access_revoked_at: membership.discord_access_revoked_at || null,
    requires_discord_link: Boolean(
      isMembershipActive(membership) &&
      (!discordLinked || membership.discord_role_status === 'link_required'),
    ),
  };
};

export const createDiscordLinkState = () => {
  const state =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = new Date(
    Date.now() + COMMUNITY_DISCORD_LINK_TTL_MINUTES * 60 * 1000,
  ).toISOString();
  return {state, expiresAt};
};

export const buildMembershipUpsert = ({
  userId,
  checkoutSession,
  subscription,
  inviteUrl = COMMUNITY_INVITE_URL,
}) => ({
  user_id: userId,
  stripe_customer_id: checkoutSession?.customer || null,
  stripe_subscription_id:
    subscription?.id || checkoutSession?.subscription || null,
  stripe_checkout_session_id: checkoutSession?.id || null,
  plan_code:
    checkoutSession?.metadata?.plan_code ||
    subscription?.metadata?.plan_code ||
    COMMUNITY_PLAN_CODE,
  status: subscription?.status || 'active',
  price_cents: COMMUNITY_PRICE_CENTS,
  currency: COMMUNITY_CURRENCY,
  interval: COMMUNITY_INTERVAL,
  discord_invite_url:
    checkoutSession?.metadata?.discord_invite_url ||
    subscription?.metadata?.discord_invite_url ||
    inviteUrl,
  current_period_start: toIsoOrNull(subscription?.current_period_start),
  current_period_end: toIsoOrNull(subscription?.current_period_end),
  cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
});
