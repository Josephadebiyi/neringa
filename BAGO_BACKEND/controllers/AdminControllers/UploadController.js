import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const adminUploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileBase64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

        const result = await cloudinary.v2.uploader.upload(dataUri, {
            folder: 'bago_admin_uploads',
            resource_type: 'auto',
        });

        res.status(200).json({
            success: true,
            url: result.secure_url,
            message: 'File uploaded successfully',
        });
    } catch (error) {
        console.error('Admin Upload Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
