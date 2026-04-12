import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotificationToToken } from '../../services/pushNotificationService.js';

export const sendNotification = async (req, res) => {
  const { userId, title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    let rows = [];

    if (userId) {
      const user = await queryOne(
        `SELECT id, push_tokens FROM public.profiles WHERE id = $1`, [userId]
      );
      if (!user || !user.push_tokens?.length) {
        return res.status(404).json({ error: 'No tokens for this user' });
      }
      rows = [user];
    } else {
      const result = await query(
        `SELECT id, push_tokens FROM public.profiles WHERE push_tokens IS NOT NULL AND array_length(push_tokens, 1) > 0`
      );
      rows = result.rows;
      if (!rows.length) {
        return res.status(404).json({ error: 'No users with push tokens' });
      }
    }

    const uniqueTokens = new Set();
    for (const user of rows) {
      if (Array.isArray(user.push_tokens)) {
        for (const token of user.push_tokens) {
          if (typeof token === 'string' && token.trim()) uniqueTokens.add(token.trim());
        }
      }
    }

    if (!uniqueTokens.size) {
      return res.status(404).json({ error: 'No tokens to send to' });
    }

    let sentCount = 0;
    const results = [];
    for (const token of uniqueTokens) {
      const result = await sendPushNotificationToToken(token, title, body);
      results.push(result);
      if (result?.ok) sentCount++;
    }

    res.json({
      success: true,
      count: sentCount,
      recipientCount: uniqueTokens.size,
      results,
      message: 'Broadcasting completed',
    });
  } catch (err) {
    console.error('Send broadcast notification error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
