import { createPackageRecord, deletePackageRecord, getPackageById } from '../lib/postgres/shipping.js';
import { queryOne } from '../lib/postgres/db.js';

export const createPackage = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const {
      from_city, from_country, to_city, to_country,
      package_details, recipient_details,
    } = req.body;

    // Support both legacy flat and new structured payload
    const fromCity = (from_city || req.body.fromCity)?.trim();
    const fromCountry = (from_country || req.body.fromCountry)?.trim();
    const toCity = (to_city || req.body.toCity)?.trim();
    const toCountry = (to_country || req.body.toCountry)?.trim();

    const packageWeight = package_details?.package_weight ?? req.body.packageWeight ?? req.body.weight;
    const category = (package_details?.category || req.body.category || 'other')?.trim();
    const value = package_details?.package_value ?? req.body.value ?? 0;

    const description = package_details?.package_description ||
      (package_details?.package_name
        ? `${package_details.package_name}${package_details.package_description ? ': ' + package_details.package_description : ''}`
        : null) ||
      req.body.description ||
      'Package shipment';

    const receiverName = (recipient_details?.receiver_name || req.body.receiverName)?.trim();
    const receiverPhone = (recipient_details?.receiver_phone || req.body.receiverPhone)?.trim();
    const receiverEmail = (recipient_details?.receiver_email || req.body.receiverEmail)?.trim() || null;
    const receiverPhoneCountryCode = recipient_details?.receiver_phone_country_code || req.body.receiverPhoneCountryCode || null;
    const pickupAddress = req.body.pickupAddress || null;
    const deliveryAddress = req.body.deliveryAddress || null;

    // Validate required fields
    const missingFields = [];
    if (!fromCountry) missingFields.push('fromCountry');
    if (!fromCity) missingFields.push('fromCity');
    if (!toCountry) missingFields.push('toCountry');
    if (!toCity) missingFields.push('toCity');
    if (packageWeight === undefined || packageWeight === null || packageWeight === '') missingFields.push('packageWeight');
    if (!receiverName) missingFields.push('receiverName');
    if (!receiverPhone) missingFields.push('receiverPhone');
    if (!category) missingFields.push('category');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      });
    }

    const weightNum = Number(packageWeight);
    if (Number.isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({ message: 'Package weight must be a positive number' });
    }

    const phoneRegex = /^\+?[0-9]\d{1,14}$/;
    if (!phoneRegex.test(receiverPhone.trim())) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    // Handle image — support base64, URL, or multipart
    let imageUrl = null;
    const rawImage = req.body.image || req.body.images || package_details?.package_image;
    if (rawImage) {
      const first = Array.isArray(rawImage) ? rawImage[0] : rawImage;
      if (first && typeof first === 'string') {
        imageUrl = first; // store as-is (base64 data URI or URL)
      }
    } else if (req.files) {
      const fileField = req.files.image || req.files.images;
      const fileObj = Array.isArray(fileField) ? fileField[0] : fileField;
      if (fileObj?.data) {
        const mime = fileObj.mimetype || 'image/jpeg';
        imageUrl = `data:${mime};base64,${fileObj.data.toString('base64')}`;
      }
    }

    const pkg = await createPackageRecord({
      userId,
      fromCountry,
      fromCity,
      toCountry,
      toCity,
      packageWeight: weightNum,
      value: value || null,
      receiverName,
      receiverEmail,
      receiverPhone,
      receiverPhoneCountryCode,
      description,
      imageUrl,
      images: imageUrl ? [imageUrl] : [],
      category,
      pickupAddress,
      deliveryAddress,
    });

    return res.status(201).json({ message: 'Package created successfully', package: pkg });
  } catch (err) {
    console.error('Error creating package:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const existing = await getPackageById(id);
    if (!existing || existing.userId !== userId.toString()) {
      return res.status(404).json({ message: 'Package not found or unauthorized' });
    }

    const {
      from_city, from_country, to_city, to_country,
      package_details, recipient_details,
    } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    const set = (col, val) => { if (val !== undefined && val !== null) { fields.push(`${col} = $${idx++}`); values.push(val); } };

    set('from_city', (from_city || req.body.fromCity)?.trim());
    set('from_country', (from_country || req.body.fromCountry)?.trim());
    set('to_city', (to_city || req.body.toCity)?.trim());
    set('to_country', (to_country || req.body.toCountry)?.trim());
    set('receiver_name', (recipient_details?.receiver_name || req.body.receiverName)?.trim());
    set('receiver_phone', (recipient_details?.receiver_phone || req.body.receiverPhone)?.trim());
    set('receiver_email', (recipient_details?.receiver_email || req.body.receiverEmail)?.trim() || null);
    set('category', (package_details?.category || req.body.category)?.trim());
    set('description', package_details?.package_description || req.body.description);
    set('pickup_address', req.body.pickupAddress);
    set('delivery_address', req.body.deliveryAddress);

    const weightRaw = package_details?.package_weight ?? req.body.packageWeight ?? req.body.weight;
    if (weightRaw !== undefined && weightRaw !== null && weightRaw !== '') {
      const w = Number(weightRaw);
      if (Number.isNaN(w) || w <= 0) return res.status(400).json({ message: 'Package weight must be a positive number' });
      set('package_weight', w);
    }

    const valueRaw = package_details?.package_value ?? req.body.value;
    if (valueRaw !== undefined) set('declared_value', valueRaw || null);

    if (!fields.length) {
      return res.status(200).json({ message: 'No changes', package: existing });
    }

    values.push(id, userId);
    const updated = await queryOne(
      `UPDATE public.packages SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values
    );

    if (!updated) return res.status(404).json({ message: 'Package not found' });

    return res.status(200).json({ message: 'Package updated successfully', package: updated });
  } catch (err) {
    console.error('Error updating package:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const deleted = await deletePackageRecord(id, userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Package not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
