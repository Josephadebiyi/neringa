import cloudinary from 'cloudinary';

// Cloudinary blocks delivery of PDFs uploaded as resource_type 'image' (what
// `resource_type: 'auto'` resolves a PDF to) by default on most accounts,
// as a security measure — even with a correctly signed URL, it 401s. `raw`
// delivery isn't subject to that restriction. CAC/registration certificates
// are overwhelmingly PDFs, so this matters in practice.
export function resourceTypeForMimetype(mimetype) {
  return String(mimetype || '').toLowerCase() === 'application/pdf' ? 'raw' : 'auto';
}

// Business CAC/registration documents are uploaded with `type: 'authenticated'`
// (see controllers/userController.js's uploadBusinessDocument and
// controllers/AdminControllers/BusinessOnboardingController.js's
// adminUploadBusinessDocument) so they aren't publicly world-readable by
// guessing the URL. Cloudinary's stored secure_url for an authenticated-type
// asset is NOT directly viewable — every request 401s unless the URL carries
// a valid signature, which the plain upload response URL does not have.
// This re-signs the stored URL on read so admin/the business can actually
// open it, without changing how/where it's stored.
const AUTHENTICATED_URL_PATTERN = /\/([a-z]+)\/authenticated\/(?:v\d+\/)?(.+)\.([a-zA-Z0-9]+)(?:\?.*)?$/;

export function getViewableDocumentUrl(storedUrl) {
  if (!storedUrl) return null;
  const match = storedUrl.match(AUTHENTICATED_URL_PATTERN);
  if (!match) return storedUrl; // not an authenticated-type asset (e.g. legacy public upload) — use as-is
  const [, resourceType, publicId, format] = match;
  try {
    return cloudinary.v2.url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      format,
      sign_url: true,
      secure: true,
    });
  } catch (error) {
    console.error('Could not sign business document URL:', error.message);
    return storedUrl;
  }
}
