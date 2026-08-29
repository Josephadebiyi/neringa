// Public tracking-page URL builders for recognised external carriers. GIG
// Logistics and "Other" carriers get no button — there is no reliable single
// public tracking URL pattern for them.
const CARRIER_LABELS = {
  dhl: 'DHL',
  fedex: 'FedEx',
  ups: 'UPS',
  gig: 'GIG Logistics',
  other: 'Other',
};

const CARRIER_URL_BUILDERS = {
  dhl: (trackingNumber) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`,
  fedex: (trackingNumber) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`,
  ups: (trackingNumber) => `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`,
};

export function getCarrierLabel(carrier, customName) {
  if (carrier === 'other') return customName || 'Other';
  return CARRIER_LABELS[carrier] || carrier || null;
}

export function buildCarrierTrackingUrl(carrier, trackingNumber) {
  if (!carrier || !trackingNumber) return null;
  const builder = CARRIER_URL_BUILDERS[carrier];
  return builder ? builder(trackingNumber) : null;
}
