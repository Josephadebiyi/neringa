import { getSupabaseStorageKey } from './auth.js';
import { getSupabaseServiceRoleClient } from './client.js';

function parseDataUri(dataUri) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri || '');
  if (!match) {
    throw new Error('Invalid file payload. Expected a base64 data URI.');
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

export async function uploadDataUriToBucket({ bucket, bucketFolder, userId, filename, dataUri, upsert = false }) {
  const { contentType, buffer } = parseDataUri(dataUri);
  return uploadBufferToBucket({
    bucket,
    bucketFolder,
    userId,
    filename,
    contentType,
    buffer,
    upsert,
  });
}

export async function uploadBufferToBucket({
  bucket,
  bucketFolder,
  userId,
  filename,
  contentType,
  buffer,
  upsert = false,
}) {
  const objectPath = getSupabaseStorageKey({ userId, bucketFolder, filename });
  const supabase = getSupabaseServiceRoleClient();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      cacheControl: '3600',
      contentType,
      upsert,
    });

  if (uploadError) {
    throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    bucket,
    objectPath,
    publicUrl: publicUrlData.publicUrl,
  };
}
