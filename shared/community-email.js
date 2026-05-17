import {
  COMMUNITY_CURRENCY,
  COMMUNITY_INTERVAL,
  COMMUNITY_PLAN_CODE,
  COMMUNITY_PRICE_CENTS,
} from './community-membership.js';
import {buildDiscordGuildUrl} from './discord-community.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

const getAppUrl = (env, request) => {
  if (request?.url) return new URL(request.url).origin;
  if (env?.APP_URL) return env.APP_URL;
  if (env?.VITE_APP_URL) return env.VITE_APP_URL;
  return 'http://localhost:5173';
};

const formatPrice = (
  amount = COMMUNITY_PRICE_CENTS,
  currency = COMMUNITY_CURRENCY,
) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || COMMUNITY_CURRENCY).toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0) / 100);

const formatCadence = (interval = COMMUNITY_INTERVAL) => {
  const normalized = String(interval || COMMUNITY_INTERVAL).toLowerCase();
  if (normalized === 'month') return 'monthly';
  if (normalized === 'year') return 'yearly';
  return normalized;
};

const formatDate = value => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const buildShell = ({
  eyebrow,
  title,
  body,
  details,
  ctaLabel,
  ctaUrl,
  footnote,
}) => `
  <div style="background:#070707;padding:32px 20px;font-family:Inter,Arial,sans-serif;color:#f5f4ef;">
    <div style="max-width:620px;margin:0 auto;background:linear-gradient(180deg,#0f1014 0%,#090909 100%);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:32px;">
      <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#9b97a3;margin-bottom:16px;">${eyebrow}</div>
      <div style="font-size:42px;line-height:0.95;font-weight:900;letter-spacing:-0.04em;text-transform:uppercase;margin-bottom:20px;">${title}</div>
      <div style="font-family:'IBM Plex Mono',Menlo,monospace;font-size:16px;line-height:1.7;color:#d3d1d8;margin-bottom:28px;">${body}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;">
        ${details
          .map(
            ({label, value}) => `
              <div style="background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px 18px;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8f8b97;margin-bottom:8px;">${label}</div>
                <div style="font-size:18px;font-weight:700;color:#ffb46d;">${value}</div>
              </div>
            `,
          )
          .join('')}
      </div>
      ${
        ctaLabel && ctaUrl
          ? `<a href="${ctaUrl}" style="display:inline-block;padding:16px 24px;border-radius:16px;background:#0f1117;border:1px solid rgba(255,255,255,0.12);color:#fff;text-decoration:none;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;">${ctaLabel}</a>`
          : ''
      }
      ${
        footnote
          ? `<div style="font-family:'IBM Plex Mono',Menlo,monospace;font-size:13px;line-height:1.7;color:#8e8a96;margin-top:24px;">${footnote}</div>`
          : ''
      }
    </div>
  </div>
`;

const textShell = ({title, body, details, ctaLabel, ctaUrl, footnote}) =>
  [
    title,
    '',
    body,
    '',
    ...details.map(({label, value}) => `${label}: ${value}`),
    ctaLabel && ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : '',
    footnote ? `\n${footnote}` : '',
  ]
    .filter(Boolean)
    .join('\n');

const getEmailConfig = (env, request) => {
  const apiKey = env?.RESEND_API_KEY || '';
  const from = env?.COMMUNITY_EMAIL_FROM || '';
  if (!apiKey || !from) return null;
  return {
    apiKey,
    from,
    replyTo: env?.COMMUNITY_EMAIL_REPLY_TO || from,
    appUrl: getAppUrl(env, request),
    guildUrl: env?.DISCORD_GUILD_ID
      ? buildDiscordGuildUrl(env.DISCORD_GUILD_ID)
      : null,
  };
};

const postEmail = async (config, payload) => {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      reply_to: config.replyTo,
      ...payload,
    }),
  });
  if (!response.ok) {
    const data = await response.text();
    throw new Error(data || 'Email send failed');
  }
};

const normalizeRecipient = (user = {}) => ({
  email: user.email || '',
  riderName: user.riderName || user.email?.split('@')[0] || 'Rider',
});

const buildPlanDetails = membership => [
  {
    label: 'Pass',
    value:
      membership?.plan_code === COMMUNITY_PLAN_CODE
        ? 'Community pass'
        : membership?.plan_code || 'Community pass',
  },
  {
    label: 'Price',
    value: `${formatPrice(membership?.price_cents, membership?.currency)} ${formatCadence(membership?.interval)}`,
  },
  {
    label: 'Status',
    value: membership?.status || 'active',
  },
  {
    label: 'Renewal',
    value: formatDate(membership?.current_period_end) || 'Active now',
  },
];

export const sendCommunityActivatedEmail = async ({
  env,
  request,
  membership,
  user,
}) => {
  const config = getEmailConfig(env, request);
  const recipient = normalizeRecipient(user);
  if (!config || !recipient.email) return false;
  const details = buildPlanDetails(membership);
  await postEmail(config, {
    to: recipient.email,
    subject: 'Hard Chain community pass is live',
    html: buildShell({
      eyebrow: 'Hard Chain',
      title: 'Community pass active',
      body: `Ciao ${recipient.riderName}. Your Hard Chain community pass is active. The lane is open for ride planning, bike talk, parts swaps, and Discord access with the crew.`,
      details,
      ctaLabel: 'Open account',
      ctaUrl: `${config.appUrl}/account`,
      footnote:
        'Next step: connect Discord from your account if you have not linked it yet.',
    }),
    text: textShell({
      title: 'Community pass active',
      body: `Ciao ${recipient.riderName}. Your Hard Chain community pass is active.`,
      details,
      ctaLabel: 'Open account',
      ctaUrl: `${config.appUrl}/account`,
      footnote:
        'Next step: connect Discord from your account if you have not linked it yet.',
    }),
  });
  return true;
};

export const sendCommunityDiscordLinkedEmail = async ({
  env,
  request,
  membership,
  user,
}) => {
  const config = getEmailConfig(env, request);
  const recipient = normalizeRecipient(user);
  if (!config || !recipient.email) return false;
  const details = [
    {label: 'Pass', value: 'Community pass'},
    {label: 'Discord', value: membership?.discord_username || 'Linked'},
    {label: 'Role', value: membership?.discord_role_status || 'granted'},
    {label: 'Server', value: 'Hard Chain Crew'},
  ];
  await postEmail(config, {
    to: recipient.email,
    subject: 'Discord access granted',
    html: buildShell({
      eyebrow: 'Hard Chain',
      title: 'Discord linked',
      body: 'You are in. Your Discord access is now linked to the community pass, and the rider role is live on Hard Chain Crew.',
      details,
      ctaLabel: 'Open Discord',
      ctaUrl: config.guildUrl || `${config.appUrl}/account`,
      footnote:
        'Use the account page any time to manage billing or reconnect Discord.',
    }),
    text: textShell({
      title: 'Discord linked',
      body: 'You are in. Your Discord access is linked to the community pass.',
      details,
      ctaLabel: 'Open Discord',
      ctaUrl: config.guildUrl || `${config.appUrl}/account`,
      footnote:
        'Use the account page any time to manage billing or reconnect Discord.',
    }),
  });
  return true;
};

export const sendCommunityCanceledEmail = async ({
  env,
  request,
  membership,
  user,
}) => {
  const config = getEmailConfig(env, request);
  const recipient = normalizeRecipient(user);
  if (!config || !recipient.email) return false;
  const details = [
    {label: 'Pass', value: 'Community pass'},
    {label: 'Status', value: membership?.status || 'canceled'},
    {label: 'Discord', value: membership?.discord_role_status || 'revoked'},
    {
      label: 'Ends',
      value: formatDate(membership?.current_period_end) || 'Access removed',
    },
  ];
  await postEmail(config, {
    to: recipient.email,
    subject: 'Community pass canceled',
    html: buildShell({
      eyebrow: 'Hard Chain',
      title: 'Pass canceled',
      body: 'Your community pass has been canceled and the Discord access lane has been closed. If you come back later, the crew door reopens as soon as the pass is active again.',
      details,
      ctaLabel: 'Manage account',
      ctaUrl: `${config.appUrl}/account`,
      footnote:
        'If this was not expected, open your account and check the billing details.',
    }),
    text: textShell({
      title: 'Pass canceled',
      body: 'Your community pass has been canceled and Discord access has been closed.',
      details,
      ctaLabel: 'Manage account',
      ctaUrl: `${config.appUrl}/account`,
      footnote:
        'If this was not expected, open your account and check the billing details.',
    }),
  });
  return true;
};
