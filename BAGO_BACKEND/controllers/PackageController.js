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

    // fields from body (strings)
    const {
      fromCountry,
      fromCity,
      toCountry,
      toCity,
      packageWeight,
      receiverName,
      receiverPhone,
      description,
      value, // optional value field (string or numeric)
      length,
      width,
      height,
    } = req.body;

    // Validate minimum required fields
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'user is not verified' });
    }
    if (!fromCountry || !fromCity || !toCountry || !toCity || !packageWeight || !receiverName || !receiverPhone || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const weightNum = Number(packageWeight);
    const lengthNum = Number(length) || 0;
    const widthNum = Number(width) || 0;
    const heightNum = Number(height) || 0;

    if (Number.isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({ message: 'Package weight must be a positive number' });
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(receiverPhone)) {
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
    else if (req.body.image || req.body.images) {
      const bodyImgs = req.body.image ? req.body.image : req.body.images;
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
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      receiverName,
      receiverPhone,
      receiverEmail: req.body.receiverEmail || null,
      description,
      image: imageUrls[0] || null,
      value: value || null,
      category: req.body.category || 'other',
    });

    await newPackage.save();

    return res.status(201).json({ message: 'Package created successfully', package: newPackage });
  } catch (err) {
    console.error('Error creating package:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
};
