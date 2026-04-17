import { query } from './lib/postgres/db.js';

async function checkTokens() {
  try {
    const res = await query('SELECT id, email, first_name, push_tokens FROM public.profiles WHERE push_tokens IS NOT NULL AND array_length(push_tokens, 1) > 0');
    console.log('Users with push tokens:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkTokens();
