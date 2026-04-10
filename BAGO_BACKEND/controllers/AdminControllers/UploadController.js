import cloudinary from 'cloudinary';

export const adminUploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Convert buffer to Base64 data URI (storage-free method)
        const fileBase64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

        // Return the full data URI as the image URL
        res.status(200).json({
            success: true,
            url: dataUri,
            message: 'File processed successfully as Base64'
        });
    } catch (error) {
        console.error('Admin Upload Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
