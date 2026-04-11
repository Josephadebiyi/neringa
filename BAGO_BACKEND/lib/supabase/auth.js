import { createSupabaseUserClient } from './client.js';

export async function getSupabaseUserFromRequest(req) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) return null;

  const supabase = createSupabaseUserClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    throw error;
  }

  return data.user ?? null;
}

export function getSupabaseStorageKey({ userId, bucketFolder, filename }) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${bucketFolder}/${userId}/${Date.now()}-${safeName}`;
}
