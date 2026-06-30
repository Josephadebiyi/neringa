export const BRAND = '#5C4DFF';
export const LOGO = 'https://sendwithbago.com/logo.png';

const footer = {
  tagline: 'Peer-to-peer delivery, powered by people already going your way.',
  social: 'Instagram · TikTok · LinkedIn',
  address: 'Bago Technologies Ltd · London',
  unsubscribeUrl: 'https://sendwithbago.com/unsubscribe',
  prefsUrl: 'https://sendwithbago.com/preferences',
};

export const productLaunchDefault = {
  brand: BRAND,
  logo: LOGO,
  preheader: 'Your parcel, paired with a verified traveler in seconds.',
  browserUrl: 'https://sendwithbago.com',
  heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
  badge: 'New · just landed',
  heading: 'Meet Instant Match.',
  body: 'Your parcel, paired with a verified traveler heading exactly where it needs to go — in seconds, not days. No warehouses, no waiting rooms. Just people already on the move.',
  ctaText: 'Try Instant Match →',
  ctaUrl: 'https://sendwithbago.com/instant-match',
  features: [
    { icon: '✓', title: 'Verified travelers only', text: 'Every traveler is ID-checked and rated by senders like you.' },
    { icon: '◎', title: 'Live tracking, end to end', text: 'Follow your parcel from pickup to doorstep in real time.' },
    { icon: '€', title: 'Up to 60% cheaper', text: 'Skip the couriers. Pay travelers already going your way.' },
  ],
  secondaryLink: { text: 'See how it works →', url: 'https://sendwithbago.com/how-it-works' },
  footerLinks: [
    { text: 'How it works', url: 'https://sendwithbago.com/how-it-works' },
    { text: 'Become a traveler', url: 'https://sendwithbago.com/travel' },
    { text: 'Help center', url: 'https://sendwithbago.com/help' },
  ],
  footer,
};

export const newsletterDefault = {
  brand: BRAND,
  logo: LOGO,
  viewUrl: 'https://sendwithbago.com/brief/14',
  issueTitle: 'The Bago Brief',
  issueMeta: 'Issue 14 · June 2026 · Your monthly delivery dispatch',
  intro: "Summer's the busiest season on the network. Here's where senders are saving most, a traveler who turned trips into income, and what's new in the app this month.",
  stories: [
    {
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1100&q=80',
      tag: 'Routes',
      title: '5 routes where senders are saving the most this summer',
      text: 'London–Lagos, Paris–Casablanca and three more corridors where traveler supply is high and prices are dropping fast.',
      linkText: 'Read the breakdown →',
      linkUrl: 'https://sendwithbago.com/brief/routes',
    },
    {
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1100&q=80',
      tag: 'Traveler spotlight',
      title: 'How Amara funded a month abroad carrying parcels',
      text: '"I was flying anyway — Bago just paid for my flights." A few minutes per pickup, real money per drop-off.',
      linkText: 'Read her story →',
      linkUrl: 'https://sendwithbago.com/brief/amara',
    },
  ],
  stats: [
    { value: '1.2M', label: 'parcels delivered' },
    { value: '48', label: 'countries live' },
    { value: '4.9★', label: 'avg rating' },
  ],
  ctaText: 'Open the app',
  ctaUrl: 'https://sendwithbago.com/app',
  footer,
};

export const promoDefault = {
  brand: BRAND,
  logo: LOGO,
  browserUrl: 'https://sendwithbago.com',
  offerKicker: 'Limited-time offer',
  offerHeading: ['Your next parcel,', '€10 lighter.'],
  offerSub: 'New here? Your first delivery is on us — up to €10 off when you send with a verified traveler.',
  code: 'BAGO10',
  codeNote: 'Applied automatically at checkout',
  heroImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1100&q=80',
  ctaText: 'Claim €10 credit',
  ctaUrl: 'https://sendwithbago.com/claim',
  ctaNote: 'No subscription. Credit applies to your first send.',
  steps: [
    { strong: 'Post your parcel', rest: ' — size, route, and when it needs to arrive.' },
    { strong: 'Match with a traveler', rest: ' — verified, rated, going your way.' },
    { strong: 'Track to delivery', rest: " — live updates until it's in their hands." },
  ],
  referralText: 'Travelling soon? ',
  referralStrong: 'Earn on every parcel you carry.',
  referralLinkText: 'Become a traveler →',
  referralUrl: 'https://sendwithbago.com/travel',
  footer,
};

export type ProductLaunchContent = typeof productLaunchDefault;
export type NewsletterContent = typeof newsletterDefault;
export type PromoContent = typeof promoDefault;
