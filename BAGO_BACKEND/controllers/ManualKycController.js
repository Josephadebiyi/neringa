import { v2 as cloudinary } from 'cloudinary';
import { query, queryOne } from '../lib/postgres/db.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });

// POST /api/bago/kyc/manual-submit
// Accepts multipart: id_front, id_back (optional), selfie, id_type, id_number (optional)
export const submitManualKyc = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const user = await queryOne(
      `SELECT id, kyc_status as "kycStatus" FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.kycStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'KYC already approved' });
    }

    const { id_type, id_number } = req.body;
    if (!id_type) return res.status(400).json({ success: false, message: 'id_type is required' });

    // express-fileupload puts files on req.files as UploadedFile objects with .data buffer
    const files = req.files || {};
    const idFrontFile = files.id_front;
    const selfieFile  = files.selfie;

    if (!idFrontFile) return res.status(400).json({ success: false, message: 'id_front image is required' });
    if (!selfieFile)  return res.status(400).json({ success: false, message: 'selfie image is required' });

    const ts = Date.now();
    const [idFrontUrl, selfieUrl] = await Promise.all([
      uploadToCloudinary(idFrontFile.data, 'bago/kyc/id_docs', `${userId}_id_front_${ts}`),
      uploadToCloudinary(selfieFile.data,  'bago/kyc/selfies',  `${userId}_selfie_${ts}`),
    ]);

    let idBackUrl = null;
    const idBackFile = files.id_back;
    if (idBackFile) {
      idBackUrl = await uploadToCloudinary(idBackFile.data, 'bago/kyc/id_docs', `${userId}_id_back_${ts}`);
    }

    const submissionData = {
      idType: id_type,
      idNumber: id_number || null,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
      submittedAt: new Date().toISOString(),
    };

    await query(
      `UPDATE public.profiles
       SET kyc_status = 'manual_review',
           kyc_provider = 'manual',
           kyc_verified_data = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, JSON.stringify(submissionData)]
    );

    // Notify admin via push (admin users) - best effort
    try {
      const admins = await query(
        `SELECT id FROM public.profiles WHERE role = 'admin' AND push_tokens IS NOT NULL AND array_length(push_tokens, 1) > 0`
      );
      for (const admin of (admins.rows || [])) {
        sendPushNotification(admin.id, 'KYC Review Required', 'A user submitted manual ID verification documents.', { type: 'admin_kyc_review' })
          .catch(() => {});
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Documents submitted successfully. Our team will review within 1–2 business days.',
      status: 'manual_review',
    });
  } catch (err) {
    console.error('Manual KYC submit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit documents. Please try again.' });
  }
};

// GET /api/bago/kyc/manual-status
export const getManualKycStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await queryOne(
      `SELECT kyc_status as "kycStatus", kyc_provider as "kycProvider",
              kyc_verified_data as "kycVerifiedData", kyc_failure_reason as "kycFailureReason",
              kyc_verified_at as "kycVerifiedAt"
       FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      status: user.kycStatus,
      provider: user.kycProvider,
      failureReason: user.kycFailureReason,
      verifiedAt: user.kycVerifiedAt,
      submittedAt: user.kycVerifiedData?.submittedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch KYC status' });
  }
};
