import multer from 'multer';

const storage = multer.memoryStorage();
const allowedUploadMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

export const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedUploadMimeTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Unsupported file type.'));
  },
});
