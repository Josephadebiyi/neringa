import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const outputRoot = process.argv[2];
if (!outputRoot) throw new Error('Usage: node export-object-storage.mjs <output-directory>');

const safeSegment = (value) => Buffer.from(String(value || 'unnamed')).toString('base64url');

async function writeResponse(response, destination) {
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${response.url}`);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes, { mode: 0o600 });
  return bytes.length;
}

async function exportSupabaseStorage() {
  if (process.env.DR_INCLUDE_SUPABASE_STORAGE === 'false') return { skipped: true };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase Storage backup requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const requested = new Set((process.env.DR_SUPABASE_BUCKETS || '').split(',').map(v => v.trim()).filter(Boolean));
  const { data: allBuckets, error: bucketError } = await client.storage.listBuckets();
  if (bucketError) throw bucketError;
  const buckets = requested.size ? allBuckets.filter(bucket => requested.has(bucket.name)) : allBuckets;
  const manifest = [];

  async function walk(bucket, prefix = '') {
    let offset = 0;
    while (true) {
      const { data, error } = await client.storage.from(bucket).list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error) throw error;
      if (!data?.length) break;
      for (const entry of data) {
        const objectName = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (!entry.id) {
          await walk(bucket, objectName);
          continue;
        }
        const { data: blob, error: downloadError } = await client.storage.from(bucket).download(objectName);
        if (downloadError) throw downloadError;
        const destination = path.join(outputRoot, 'supabase-storage', safeSegment(bucket), ...objectName.split('/').map(safeSegment));
        await fs.mkdir(path.dirname(destination), { recursive: true });
        const bytes = Buffer.from(await blob.arrayBuffer());
        await fs.writeFile(destination, bytes, { mode: 0o600 });
        manifest.push({ bucket, object: objectName, bytes: bytes.length, updatedAt: entry.updated_at || null });
      }
      if (data.length < 1000) break;
      offset += data.length;
    }
  }

  for (const bucket of buckets) await walk(bucket.name);
  await fs.writeFile(path.join(outputRoot, 'supabase-storage-manifest.json'), JSON.stringify(manifest, null, 2));
  return { buckets: buckets.length, objects: manifest.length, bytes: manifest.reduce((sum, item) => sum + item.bytes, 0) };
}

async function exportCloudinary() {
  if (process.env.DR_INCLUDE_CLOUDINARY === 'false') return { skipped: true };
  const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = process.env;
  if (!cloud_name || !api_key || !api_secret) throw new Error('Cloudinary backup credentials are incomplete');
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  const prefix = (process.env.DR_CLOUDINARY_PREFIX || '').trim();
  const manifest = [];

  for (const resourceType of ['image', 'video', 'raw']) {
    let nextCursor;
    do {
      const options = {
        type: 'upload', resource_type: resourceType, max_results: 500, next_cursor: nextCursor,
      };
      if (prefix) options.prefix = prefix;
      const response = await cloudinary.api.resources(options);
      for (const resource of response.resources || []) {
        const destination = path.join(outputRoot, 'cloudinary', resourceType, ...resource.public_id.split('/').map(safeSegment));
        const bytes = await writeResponse(await fetch(resource.secure_url), destination);
        manifest.push({ publicId: resource.public_id, resourceType, format: resource.format || null, bytes, version: resource.version });
      }
      nextCursor = response.next_cursor;
    } while (nextCursor);
  }
  await fs.writeFile(path.join(outputRoot, 'cloudinary-manifest.json'), JSON.stringify(manifest, null, 2));
  return { objects: manifest.length, bytes: manifest.reduce((sum, item) => sum + item.bytes, 0) };
}

await fs.mkdir(outputRoot, { recursive: true, mode: 0o700 });
const summary = {
  createdAt: new Date().toISOString(),
  supabaseStorage: await exportSupabaseStorage(),
  cloudinary: await exportCloudinary(),
};
await fs.writeFile(path.join(outputRoot, 'object-storage-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
