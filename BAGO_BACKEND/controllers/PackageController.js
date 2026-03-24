// controllers/PackageController.js
import cloudinary from 'cloudinary';
import mongoose from 'mongoose';
import Package from '../models/PackageScheme.js'; // adjust path

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper to skip cloudinary and use base64
const uploadToCloudinary = async (dataUri) => {
  return dataUri;
};

export const createPackage = async (req, res) => {
  try {
    const userId = req.user._id;

    // Extract fields — supporting both legacy flat structure and new structured payload
    const {
      from_city,
      from_country,
      to_city,
      to_country,
      package_details,
      recipient_details
    } = req.body;

    // Normalization layer to bridge different payload formats
    const fromCity = (from_city || req.body.fromCity)?.trim();
    const fromCountry = (from_country || req.body.fromCountry)?.trim();
    const toCity = (to_city || req.body.toCity)?.trim();
    const toCountry = (to_country || req.body.toCountry)?.trim();

    const packageWeight = package_details?.package_weight || req.body.packageWeight;
    const category = (package_details?.category || req.body.category || 'other')?.trim();
    const value = package_details?.package_value || req.body.value || 0;
    
    // Construct description from name/description if provided in new format
    const description = package_details?.package_description || 
                        (package_details?.package_name ? `${package_details.package_name}: ${package_details.package_description || ''}` : null) ||
                        req.body.description;

    const receiverName = (recipient_details?.receiver_name || req.body.receiverName)?.trim();
    const receiverPhone = (recipient_details?.receiver_phone || req.body.receiverPhone)?.trim();
    const receiverEmail = (recipient_details?.receiver_email || req.body.receiverEmail)?.trim();

    // Log received data for debugging
    console.log('📦 Structured Package creation request:', {
      fromCountry, fromCity, toCountry, toCity,
      packageWeight, receiverName, category,
      hasImage: !!(req.body.image || package_details?.package_image),
    });

    // Validate minimum required fields
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'user is not verified' });
    }

    // Validate required fields (empty strings are not allowed)
    // const category = req.body.category; // This line is now redundant due to normalization

    // Log ALL received data for debugging - This is now replaced by the structured log above
    // console.log('📦 Package creation request:', {
    //   fromCountry, fromCity, toCountry, toCity,
    //   packageWeight, receiverName, receiverPhone,
    //   category, description,
    //   hasImage: !!req.body.image,
    //   allBodyKeys: Object.keys(req.body)
    // });

    const missingFields = [];
    if (!fromCountry?.trim()) missingFields.push('fromCountry');
    if (!fromCity?.trim()) missingFields.push('fromCity');
    if (!toCountry?.trim()) missingFields.push('toCountry');
    if (!toCity?.trim()) missingFields.push('toCity');
    if (packageWeight === undefined || packageWeight === null || packageWeight === '') missingFields.push('packageWeight');
    if (!receiverName?.trim()) missingFields.push('receiverName');
    if (!receiverPhone?.trim()) missingFields.push('receiverPhone');
    if (!category?.trim()) missingFields.push('category');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // Description is optional
    if (!description) {
      console.warn('Package created without description - using default');
    }

    const weightNum = Number(packageWeight);

    if (Number.isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({ message: 'Package weight must be a positive number' });
    }

    const phoneRegex = /^\+?[0-9]\d{1,14}$/; // Relaxed regex to allow 0 at start
    if (!phoneRegex.test(receiverPhone.trim())) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    // Handle image input — support multiple input shapes:
    let imageUrls = [];

    // 1) multipart file present?
    if (req.files && (req.files.image || req.files.images)) {
      const fileField = req.files.image || req.files.images;
      const fileObj = Array.isArray(fileField) ? fileField[0] : fileField;

      if (fileObj && fileObj.data) {
        const mime = fileObj.mimetype || 'image/jpeg';
        const base64 = fileObj.data.toString('base64');
        const dataUri = `data:${mime};base64,${base64}`;
        const url = await uploadToCloudinary(dataUri);
        imageUrls.push(url);
      }
    }
    // 2) base64 in JSON body?
    else if (req.body.image || req.body.images || package_details?.package_image) {
      const bodyImgs = req.body.image || req.body.images || package_details?.package_image;
      const arr = Array.isArray(bodyImgs) ? bodyImgs : [bodyImgs];
      const first = arr[0];
      if (first) {
        if (/^https?:\/\//i.test(first)) {
          imageUrls.push(first);
        } else if (/^data:([a-zA-Z0-9\/+.-]+);base64,/.test(first)) {
          const url = await uploadToCloudinary(first);
          imageUrls.push(url);
        } else {
          const dataUri = `data:image/jpeg;base64,${first}`;
          const url = await uploadToCloudinary(dataUri);
          imageUrls.push(url);
        }
      }
    }

    // Create and save package
    const newPackage = new Package({
      userId,
      fromCountry,
      fromCity,
      toCountry,
      toCity,
      packageWeight: weightNum,
      receiverName,
      receiverPhone,
      receiverEmail: receiverEmail || null,
      description: description || 'Package shipment', // Default if not provided
      image: imageUrls[0] || null,
      value: value || null, // Optional - only required if insurance is requested
      category: category,
    });

    await newPackage.save();

    return res.status(201).json({ message: 'Package created successfully', package: newPackage });
  } catch (err) {
    console.error('Error creating package:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    
    const pkg = await Package.findOne({ _id: id, userId: userId });
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found or unauthorized' });
    }
    
    await Package.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
