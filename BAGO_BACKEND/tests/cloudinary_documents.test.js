import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ privateDownloadUrl: vi.fn(), signedUrl: vi.fn() }));

vi.mock('cloudinary', () => ({
  default: {
    v2: {
      utils: { private_download_url: mocks.privateDownloadUrl },
      url: mocks.signedUrl,
    },
  },
}));

import { getViewableDocumentUrl } from '../lib/cloudinaryDocuments.js';

describe('getViewableDocumentUrl', () => {
  beforeEach(() => {
    mocks.privateDownloadUrl.mockReset().mockReturnValue('https://api.cloudinary.test/download?signed=1');
    mocks.signedUrl.mockReset();
  });

  it('uses the private download endpoint for legacy image/authenticated PDFs', () => {
    const result = getViewableDocumentUrl(
      'https://res.cloudinary.com/demo/image/authenticated/s--old--/v1/bago/business_documents/registration_123.pdf',
    );

    expect(result).toBe('https://api.cloudinary.test/download?signed=1');
    expect(mocks.privateDownloadUrl).toHaveBeenCalledWith(
      'bago/business_documents/registration_123',
      'pdf',
      { resource_type: 'image', type: 'authenticated', attachment: false },
    );
  });

  it('uses the private download endpoint for legacy public trip-proof PDFs', () => {
    getViewableDocumentUrl(
      'https://res.cloudinary.com/demo/image/upload/v1/bago/travel_documents/trip_proof_123.pdf',
    );

    expect(mocks.privateDownloadUrl).toHaveBeenCalledWith(
      'bago/travel_documents/trip_proof_123',
      'pdf',
      { resource_type: 'image', type: 'upload', attachment: false },
    );
  });

  it('does not double-sign an existing authenticated image URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/authenticated/s--valid--/v1/bago/business_documents/certificate.png';
    expect(getViewableDocumentUrl(url)).toBe(url);
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });
});
