// controllers/PackageController.js
import cloudinary from 'cloudinary';
import mongoose from 'mongoose';
import Package from '../models/PackageScheme.js'; // adjust path

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper to upload a base64 data URI (or Buffer converted to dataURI)
const uploadToCloudinary = async (dataUri) => {
  // expects dataUri like 'data:image/jpeg;base64,...'
  const result = await cloudinary.v2.uploader.upload(dataUri, {
    folder: 'packages',
    resource_type: 'image',
    timeout: 60000,
  });
  return result.secure_url;
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
    } = req.body;

    // Validate minimum required fields
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'user is not verified' });
    }
    if (!fromCountry || !fromCity || !toCountry || !toCity || !packageWeight || !receiverName || !receiverPhone || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const weightNum = Number(packageWeight);
    if (Number.isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({ message: 'Package weight must be a positive number' });
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(receiverPhone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    // Handle image input — support multiple input shapes:
    // 1) multipart file(s): req.files.image or req.files.images (express-fileupload)
    // 2) base64 string(s) in req.body.images (string or array of dataURI strings)
    // We'll accept one image (first) per your "only one image" request.
    let imageUrls = [];

    // 1) multipart file present?
    if (req.files && (req.files.image || req.files.images)) {
      // If images is array-like or single file
      const fileField = req.files.image || req.files.images;
      // fileField may be an array or single file object
      const fileObj = Array.isArray(fileField) ? fileField[0] : fileField;

      // fileObj has: name, mimetype, data (Buffer) if useTempFiles: false
      if (!fileObj || !fileObj.data) {
        return res.status(400).json({ message: 'Invalid uploaded file' });
      }

      // convert buffer to base64 data URI
      const mime = fileObj.mimetype || 'image/jpeg';
      const base64 = fileObj.data.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;

      const url = await uploadToCloudinary(dataUri);
      imageUrls.push(url);
    }
    // 2) base64 in JSON body? accept req.body.image (single) or req.body.images (array)
    else if (req.body.image || req.body.images) {
      const bodyImgs = req.body.image ? req.body.image : req.body.images;
      const arr = Array.isArray(bodyImgs) ? bodyImgs : [bodyImgs];
      const first = arr[0];
      if (first) {
        // if it's already an http url, keep; else assume dataURI base64
        if (/^https?:\/\//i.test(first)) {
          imageUrls.push(first);
        } else if (/^data:([a-zA-Z0-9\/+.-]+);base64,/.test(first)) {
          const url = await uploadToCloudinary(first);
          imageUrls.push(url);
        } else {
          // If the client sent raw base64 without data URI prefix, allow that:
          const dataUri = `data:image/jpeg;base64,${first}`;
          const url = await uploadToCloudinary(dataUri);
          imageUrls.push(url);
        }
      }
    }

    // Create and save package (images is array of urls or empty)
    const newPackage = new Package({
      userId,
      fromCountry,
      fromCity,
      toCountry,
      toCity,
      packageWeight: weightNum,
      receiverName,
      receiverPhone,
      description,
      images: imageUrls,     // store array of strings (urls)
      value: value || null,  // store provided value
    });

    await newPackage.save();

    return res.status(201).json({ message: 'Package created successfully', package: newPackage });
  } catch (err) {
    console.error('Error creating package:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
};
