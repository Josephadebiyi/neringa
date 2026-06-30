const BRAND = '#5C4DFF';
const LOGO = 'https://sendwithbago.com/logo.png';
const FALLBACK_LOGO = 'https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sendwithbago.com';

const footer = {
  tagline: 'Peer-to-peer delivery, powered by people already going your way.',
  social: 'Instagram · TikTok · LinkedIn',
  address: 'Bago Technologies Ltd · London',
  unsubscribeUrl: `${FRONTEND_URL}/unsubscribe`,
  prefsUrl: `${FRONTEND_URL}/preferences`,
};

export const PROMO_EMAIL_TEMPLATES = {
  productLaunch: {
    label: 'Product launch',
    subject: 'Meet Instant Match',
    body: 'Your parcel, paired with a verified traveler heading exactly where it needs to go — in seconds, not days. No warehouses, no waiting rooms. Just people already on the move.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
  },
  newsletter: {
    label: 'Newsletter digest',
    subject: 'The Bago Brief',
    body: "Summer's the busiest season on the network. Here's where senders are saving most, a traveler who turned trips into income, and what's new in the app this month.",
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1100&q=80',
  },
  promo: {
    label: 'Send & Earn promo',
    subject: 'Your next parcel, €10 lighter',
    body: 'New here? Your first delivery is on us — up to €10 off when you send with a verified traveler.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1100&q=80',
  },
};

export function isPromoTemplateId(templateId) {
  return Boolean(PROMO_EMAIL_TEMPLATES[String(templateId || '')]);
}

export function renderPromoEmailTemplate({ templateId, subject, body, images = [] }) {
  const id = isPromoTemplateId(templateId) ? templateId : 'promo';
  const template = PROMO_EMAIL_TEMPLATES[id];
  const content = {
    brand: BRAND,
    logo: LOGO,
    fallbackLogo: FALLBACK_LOGO,
    subject: subject || template.subject,
    body: body || template.body,
    heroImage: images?.[0] || template.image,
    secondImage: images?.[1] || null,
    footer,
  };

  if (id === 'productLaunch') return renderDocument(content, renderProductLaunch(content));
  if (id === 'newsletter') return renderDocument(content, renderNewsletter(content));
  return renderDocument(content, renderSendEarnPromo(content));
}

function renderDocument(content, innerHtml) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(content.subject)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background:#E9E7E0;-webkit-font-smoothing:antialiased;}
    img{-ms-interpolation-mode:bicubic;}
    a{text-decoration:none;}
    @media(max-width:620px){.bago-wrap{padding:16px!important}.bago-card{border-radius:18px!important}.bago-pad{padding-left:22px!important;padding-right:22px!important}}
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.body).slice(0, 150)}</div>
  <div class="bago-wrap" style="padding:32px 16px;background:#E9E7E0;">
    ${innerHtml}
  </div>
</body>
</html>`;
}

function renderHeader(content, dark = false) {
  const logo = dark ? content.fallbackLogo : content.logo;
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 32px;border-bottom:1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#F0EEE8'};">
    <img src="${escapeAttr(logo)}" alt="Bago" height="26" style="height:26px;width:auto;display:block;border:0;${dark ? 'filter:brightness(0) invert(1);' : ''}" />
    <a href="${FRONTEND_URL}" style="font-size:12px;color:${dark ? 'rgba(255,255,255,0.55)' : '#9A9EA8'};font-weight:500;text-decoration:none;">View in browser</a>
  </div>`;
}

function renderFooter(content, legal = "You're receiving this because you have a Bago account.") {
  const f = content.footer;
  return `<div style="padding:28px 32px 30px;background:#FAF9F6;border-top:1px solid #F0EEE8;">
    <p style="font-size:13px;line-height:1.55;color:#6A6E78;margin:0 0 14px;max-width:360px;">${escapeHtml(f.tagline)}</p>
    <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13px;font-weight:500;padding-bottom:14px;border-bottom:1px solid #ECEAE3;margin-bottom:14px;">
      <a href="${FRONTEND_URL}/how-it-works" style="color:#14161B;text-decoration:none;">How it works</a>
      <a href="${FRONTEND_URL}/travel" style="color:#14161B;text-decoration:none;">Become a traveler</a>
      <a href="${FRONTEND_URL}/help" style="color:#14161B;text-decoration:none;">Help center</a>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
      <span style="font-size:12px;color:#9A9EA8;">${escapeHtml(f.social)}</span>
      <span style="font-size:12px;color:#9A9EA8;">${escapeHtml(f.address)}</span>
    </div>
    <p style="font-size:12px;color:#B2B6BE;margin:14px 0 0;">${escapeHtml(legal)} <a href="${escapeAttr(f.unsubscribeUrl)}" style="color:#8A8F99;text-decoration:underline;">Unsubscribe</a> · <a href="${escapeAttr(f.prefsUrl)}" style="color:#8A8F99;text-decoration:underline;">Manage preferences</a></p>
  </div>`;
}

function renderProductLaunch(content) {
  return `<div class="bago-card" style="${cardStyle()}">
    ${renderHeader(content)}
    <div style="position:relative;">
      ${imageTag(content.heroImage, 320)}
      <span style="position:absolute;top:18px;left:24px;background:rgba(20,22,27,0.86);color:#fff;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:7px 12px;border-radius:999px;">New · just landed</span>
    </div>
    <div class="bago-pad" style="padding:34px 32px 8px;">
      <h2 style="${displayStyle(34)}">Meet Instant Match.</h2>
      <p style="${bodyStyle()}">${safeMultiline(content.body)}</p>
      ${button('Try Instant Match', `${FRONTEND_URL}/instant-match`, content.brand)}
    </div>
    <div class="bago-pad" style="padding:30px 32px 8px;display:flex;flex-direction:column;gap:18px;">
      ${feature('✓', 'Verified travelers only', 'Every traveler is ID-checked and rated by senders like you.', content.brand)}
      ${feature('◎', 'Live tracking, end to end', 'Follow your parcel from pickup to doorstep in real time.', content.brand)}
      ${feature('€', 'Up to 60% cheaper', 'Skip the couriers. Pay travelers already going your way.', content.brand)}
    </div>
    <div class="bago-pad" style="padding:22px 32px 34px;"><a href="${FRONTEND_URL}/how-it-works" style="font-size:14px;font-weight:600;color:${content.brand};text-decoration:none;">See how it works →</a></div>
    ${renderFooter(content)}
  </div>`;
}

function renderNewsletter(content) {
  return `<div class="bago-card" style="${cardStyle()}">
    <div style="padding:30px 32px 26px;background:#14161B;color:#fff;">
      ${renderHeader(content, true)}
      <div style="${displayStyle(38, '#fff')};margin-top:22px;">The Bago Brief</div>
      <div style="font-size:13px;color:${content.brand};font-weight:600;letter-spacing:0.04em;margin-top:10px;">Monthly delivery dispatch</div>
    </div>
    <div class="bago-pad" style="padding:28px 32px 6px;"><p style="${bodyStyle()}">${safeMultiline(content.body)}</p></div>
    <div class="bago-pad" style="padding:26px 32px 4px;">
      ${imageTag(content.heroImage, 220, 16)}
      <div style="font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${content.brand};margin:18px 0 8px;">Routes</div>
      <h3 style="${displayStyle(23)}">Routes where senders are saving more</h3>
      <p style="font-size:15px;line-height:1.6;color:#5B5F69;margin:10px 0 12px;">Traveler supply is growing across popular corridors, helping senders move items faster and with clearer pricing.</p>
    </div>
    ${content.secondImage ? `<div class="bago-pad" style="padding:20px 32px 4px;">${imageTag(content.secondImage, 200, 16)}</div>` : ''}
    <div style="margin:28px 32px;padding:22px 24px;border-radius:16px;background:${tint(content.brand, 0.92)};display:flex;justify-content:space-between;text-align:center;gap:12px;">
      ${stat('1.2M', 'parcels delivered')}${stat('48', 'countries live')}${stat('4.9★', 'avg rating')}
    </div>
    <div style="padding:0 32px 36px;text-align:center;">${button('Open the app', `${FRONTEND_URL}/app`, content.brand, true)}</div>
    ${renderFooter(content)}
  </div>`;
}

function renderSendEarnPromo(content) {
  return `<div class="bago-card" style="${cardStyle()}">
    ${renderHeader(content)}
    <div style="padding:40px 32px 34px;text-align:center;background:${content.brand};">
      <div style="font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.82);">Limited-time offer</div>
      <h2 style="${displayStyle(38, '#fff')};margin:14px 0 0;">Your next parcel,<br />€10 lighter.</h2>
      <p style="font-size:15px;line-height:1.55;color:rgba(255,255,255,0.9);margin:16px auto 0;max-width:380px;">${safeMultiline(content.body)}</p>
    </div>
    <div style="margin:-22px 32px 0;position:relative;z-index:2;">
      <div style="background:#14161B;border-radius:16px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div><div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Use code</div><div style="${displayStyle(28, '#fff')};letter-spacing:0.06em;margin-top:2px;">BAGO10</div></div>
        <div style="border-left:1px dashed rgba(255,255,255,0.25);padding-left:18px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;max-width:130px;">Applied automatically at checkout</div>
      </div>
    </div>
    <div class="bago-pad" style="padding:28px 32px 0;">${imageTag(content.heroImage, 220, 16)}</div>
    <div style="padding:26px 32px 8px;text-align:center;">${button('Claim €10 credit', `${FRONTEND_URL}/claim`, content.brand, true)}<div style="font-size:12px;color:#9A9EA8;margin-top:12px;">No subscription. Credit applies to your first send.</div></div>
    <div class="bago-pad" style="padding:30px 32px 8px;">
      <div style="${displayStyle(19)};margin-bottom:18px;">How it works</div>
      ${step(1, 'Post your parcel', 'size, route, and when it needs to arrive.', content.brand)}
      ${step(2, 'Match with a traveler', 'verified, rated, going your way.', content.brand)}
      ${step(3, 'Track to delivery', "live updates until it's in their hands.", content.brand)}
    </div>
    <div style="margin:28px 32px 0;padding:20px 22px;border-radius:14px;border:1px solid #ECEAE3;display:flex;align-items:center;justify-content:space-between;gap:14px;">
      <div style="font-size:14px;line-height:1.5;color:#5B5F69;">Travelling soon? <strong style="color:#14161B;font-weight:600;">Earn on every parcel you carry.</strong></div>
      <a href="${FRONTEND_URL}/travel" style="flex:0 0 auto;font-size:14px;font-weight:600;color:${content.brand};text-decoration:none;">Become a traveler →</a>
    </div>
    <div style="margin-top:28px;">${renderFooter(content, 'Offer for new senders only. Terms apply.')}</div>
  </div>`;
}

function cardStyle() {
  return 'width:600px;max-width:100%;background:#FFFFFF;border-radius:22px;overflow:hidden;border:1px solid #EAE7DF;margin:0 auto;font-family:\'Schibsted Grotesk\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;';
}

function displayStyle(size, color = '#14161B') {
  return `font-family:'Bricolage Grotesque','Schibsted Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-weight:800;font-size:${size}px;line-height:1.05;letter-spacing:-0.02em;margin:0;color:${color}`;
}

function bodyStyle() {
  return 'font-size:16px;line-height:1.6;color:#4A4E57;margin:14px 0 26px;max-width:480px;';
}

function imageTag(src, height, radius = 0) {
  return `<img src="${escapeAttr(src)}" alt="" width="600" style="width:100%;height:${height}px;object-fit:cover;display:block;border:0;${radius ? `border-radius:${radius}px;` : ''}" />`;
}

function button(label, href, brand, big = false) {
  return `<a href="${escapeAttr(href)}" style="display:inline-block;background:${brand};color:#FFFFFF!important;font-weight:600;font-size:${big ? 16 : 15}px;padding:${big ? '16px 34px' : '15px 26px'};border-radius:12px;text-decoration:none;">${escapeHtml(label)}</a>`;
}

function feature(icon, title, text, brand) {
  return `<div style="display:flex;gap:16px;align-items:flex-start;padding:16px 18px;border-radius:14px;background:${tint(brand, 0.93)};">
    <span style="flex:0 0 auto;width:40px;height:40px;border-radius:11px;background:${brand};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${escapeHtml(icon)}</span>
    <div><div style="font-weight:700;font-size:15px;color:#14161B;">${escapeHtml(title)}</div><div style="font-size:14px;line-height:1.5;color:#5B5F69;margin-top:3px;">${escapeHtml(text)}</div></div>
  </div>`;
}

function stat(value, label) {
  return `<div style="flex:1;"><div style="${displayStyle(26)}">${escapeHtml(value)}</div><div style="font-size:12px;color:#6A6E78;margin-top:2px;">${escapeHtml(label)}</div></div>`;
}

function step(number, strong, rest, brand) {
  return `<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px;">
    <span style="flex:0 0 auto;width:34px;height:34px;border-radius:50%;background:${brand};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;">${number}</span>
    <div style="font-size:15px;color:#4A4E57;"><strong style="color:#14161B;font-weight:600;">${escapeHtml(strong)}</strong> — ${escapeHtml(rest)}</div>
  </div>`;
}

function tint(hex, amt) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function safeMultiline(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
