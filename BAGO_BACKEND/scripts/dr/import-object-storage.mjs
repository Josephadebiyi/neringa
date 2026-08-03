import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const root = process.argv[2];
if (!root) throw new Error('Usage: node import-object-storage.mjs <objects-directory>');
const safeSegment = (value) => Buffer.from(String(value || 'unnamed')).toString('base64url');

async function restoreSupabase() {
  const manifestPath = path.join(root, 'supabase-storage-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (const item of manifest) {
    const localPath = path.join(root, 'supabase-storage', safeSegment(item.bucket), ...item.object.split('/').map(safeSegment));
    const content = await fs.readFile(localPath);
    const { error } = await client.storage.from(item.bucket).upload(item.object, content, { upsert: true });
    if (error) throw error;
  }
  return manifest.length;
}

async function restoreCloudinary() {
  const manifestPath = path.join(root, 'cloudinary-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  for (const item of manifest) {
    const localPath = path.join(root, 'cloudinary', item.resourceType, ...item.publicId.split('/').map(safeSegment));
    await cloudinary.uploader.upload(localPath, {
      public_id: item.publicId,
      resource_type: item.resourceType,
      overwrite: true,
      invalidate: true,
    });
  }
  return manifest.length;
}

if (process.env.DR_CONFIRM_OBJECT_RESTORE !== 'RESTORE_OBJECTS') {
  throw new Error('Set DR_CONFIRM_OBJECT_RESTORE=RESTORE_OBJECTS to overwrite remote storage objects');
}
const results = {};
try { results.supabase = await restoreSupabase(); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
  results.supabase = 'not present';
}
try { results.cloudinary = await restoreCloudinary(); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
  results.cloudinary = 'not present';
}
console.log(JSON.stringify(results));
