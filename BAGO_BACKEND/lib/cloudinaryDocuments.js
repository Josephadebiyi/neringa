import cloudinary from 'cloudinary';

// Cloudinary blocks delivery of PDFs uploaded as resource_type 'image' (what
// `resource_type: 'auto'` resolves a PDF to) by default on most accounts,
// as a security measure — even with a correctly signed URL, it 401s. `raw`
// delivery isn't subject to that restriction. CAC/registration certificates
// are overwhelmingly PDFs, so this matters in practice.
export function resourceTypeForMimetype(mimetype) {
  return String(mimetype || '').toLowerCase() === 'application/pdf' ? 'raw' : 'auto';
}

// Pulls the mimetype out of a `data:<mimetype>;base64,<data>` URI, e.g. as
// used for travel-document/trip-proof uploads which arrive as base64 rather
// than a multer file with a mimetype field already attached.
export function mimeTypeFromDataUri(dataUri) {
  const match = /^data:([^;,]+)[;,]/.exec(String(dataUri || ''));
  return match ? match[1] : '';
}

// Business CAC/registration documents are uploaded with `type: 'authenticated'`
// (see controllers/userController.js's uploadBusinessDocument and
// controllers/AdminControllers/BusinessOnboardingController.js's
// adminUploadBusinessDocument) so they aren't publicly world-readable by
// guessing the URL. Cloudinary signs the secure_url it returns at upload
// time, so most stored URLs are ALREADY valid — this only needs to sign a
// URL that genuinely has no signature yet. Re-signing an already-signed URL
// mis-parses the existing `s--...--/` token as part of the public_id and
// produces a doubly-signed, 404ing URL, so this must stay idempotent.
const AUTHENTICATED_URL_PATTERN =
  /\/([a-z]+)\/authenticated\/(s--[^/]+--\/)?(?:v\d+\/)?(.+)\.([a-zA-Z0-9]+)(?:\?.*)?$/;

export function getViewableDocumentUrl(storedUrl) {
  if (!storedUrl) return null;
  const match = storedUrl.match(AUTHENTICATED_URL_PATTERN);
  if (!match) return storedUrl; // not an authenticated-type asset (e.g. legacy public upload) — use as-is
  const [, resourceType, existingSignature, publicId, format] = match;
  if (existingSignature) return storedUrl; // already signed — do not re-sign
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
