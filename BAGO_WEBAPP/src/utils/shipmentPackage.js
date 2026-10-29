export function packageContents(value) {
    return String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

export function validateShipmentPackage(form, terms = []) {
    const errors = {};
    if (!packageContents(form.contents).length) errors.contents = 'List the items inside your package, including quantities.';
    if (terms[1] !== true) errors.inspection = 'Confirm that the traveller may inspect your package.';
    if (terms.length !== 3 || !terms.every(value => value === true)) errors.agreement = 'Please confirm all three shipping agreements.';
    if (!Number.isFinite(Number(form.packageWeight)) || Number(form.packageWeight) < 0.1 || Number(form.packageWeight) > 50) errors.packageWeight = 'Enter a weight between 0.1 and 50 kg.';
    if (!Number.isFinite(Number(form.packageValue)) || Number(form.packageValue) <= 0) errors.packageValue = 'Enter the value of your items.';
    if (!form.packageImage) errors.packageImage = 'Add a clear photo of your items.';
    if (!form.receiverName?.trim()) errors.receiverName = 'Enter the recipient’s name.';
    if (!/^\+?\d{2,15}$/.test(form.receiverPhone?.trim() || '')) errors.receiverPhone = 'Enter a valid recipient phone number with country code.';
    if (!form.deliveryAddress?.trim()) errors.deliveryAddress = 'Enter the delivery address.';
    if (!['fromCity', 'fromCountry', 'toCity', 'toCountry'].every(key => form[key]?.trim())) errors.route = 'Please select a trip with complete pickup and destination details.';
    if (!form.category?.trim()) errors.category = 'Choose an item category.';
    return errors;
}

export function buildShipmentPackage(form, terms, receiverPhoneCountry) {
    const errors = validateShipmentPackage(form, terms);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const contents = packageContents(form.contents);
    return {
        from_city: form.fromCity.trim(), from_country: form.fromCountry.trim(),
        to_city: form.toCity.trim(), to_country: form.toCountry.trim(),
        package_details: {
            package_name: form.category, package_description: contents.join('; '),
            package_weight: Number(form.packageWeight), package_value: Number(form.packageValue),
            package_image: form.packageImage, category: form.category,
            contents,
            declaration: {
                ...form.declaration,
                travellerMayInspect: terms[1] === true,
                refusesInspection: terms[1] !== true,
            },
        },
        recipient_details: {
            receiver_name: form.receiverName.trim(), receiver_phone: form.receiverPhone.trim(),
            receiver_phone_country_code: String(receiverPhoneCountry || '').toUpperCase(), receiver_email: '',
        },
        deliveryAddress: form.deliveryAddress.trim(), specialInstructions: form.specialInstructions?.trim() || '',
    };
}
