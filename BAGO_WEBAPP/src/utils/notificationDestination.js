export function notificationDestination(notification) {
    const type = String(notification.type || '').toLowerCase();
    const payload = notification.payload || {};
    const requestId = payload.requestId || notification.request;
    let tab = 'overview';
    if (type === 'shipment_request') tab = 'deliveries';
    else if (type === 'escrow_release' || /payment|withdrawal|payout|wallet|referral/.test(type)) tab = 'earnings';
    else if (/message|conversation/.test(type)) tab = 'chats';
    else if (/shipment|inspection|delivery/.test(type)) tab = 'shipments';
    else if (/trip/.test(type)) tab = 'trips';
    const params = new URLSearchParams({ tab });
    if (requestId && ['shipments', 'deliveries'].includes(tab)) params.set('requestId', String(requestId));
    return `/dashboard?${params}`;
}
