const missingFieldMessages = {
    contents: 'List the items inside your package.',
    travellerMayInspect: 'Confirm that the traveller may inspect your package.',
    fromCity: 'Select your pickup city.', fromCountry: 'Select your pickup country.',
    toCity: 'Select the destination city.', toCountry: 'Select the destination country.',
    packageWeight: 'Enter the weight of your package.', category: 'Choose an item category.',
    receiverName: 'Enter the recipient’s name.', receiverPhone: 'Enter the recipient’s phone number.',
};

const safeLocalMessages = new Set([
    'International card payments are temporarily unavailable. Please try again later.',
    'Additional weight pricing could not be verified.', 'A valid payment currency is required.',
    'A valid checkout amount is required.', 'Card checkout could not start.',
    'Local checkout could not start.', 'A secure payment link could not be created.',
    'Checkout changed. Please try again.',
]);

export function customerError(error, fallback = 'We couldn’t complete this request. Please try again.') {
    const data = error?.response?.data;
    const status = error?.response?.status;
    if (['EXCHANGE_RATE_EXPIRED', 'EXCHANGE_RATE_MISSING'].includes(data?.code)) return 'Pricing is temporarily unavailable while currency rates refresh. Please try again in a few minutes.';
    if (data?.code === 'CHECKOUT_PRICE_CHANGED') return 'The shipment price has changed. Review the updated total before continuing.';
    if (data?.code === 'PHONE_NOT_VERIFIED') return 'Please verify your phone number before continuing.';
    if (data?.code === 'ITEM_IMAGE_BLOCKED' || data?.code === 'PROHIBITED_ITEM') return 'This item cannot be shipped with Bago. Check the item policy or contact support.';
    if (Array.isArray(data?.missingFields)) {
        const messages = [...new Set(data.missingFields.map(field => missingFieldMessages[field]).filter(Boolean))];
        if (messages.length) return messages.join(' ');
    }
    if (status === 401) return 'Please sign in again to continue.';
    if (status === 413) return 'The item photo is too large. Please choose a smaller image.';
    if (status === 429) return 'Please wait a moment before trying again.';
    if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') return 'We couldn’t connect. Check your internet connection and try again.';
    // Only explicitly authored local messages may pass through. Never display
    // arbitrary backend messages, field identifiers, SQL errors or stack traces.
    if (!error?.response && safeLocalMessages.has(error?.message)) return error.message;
    return fallback;
}
