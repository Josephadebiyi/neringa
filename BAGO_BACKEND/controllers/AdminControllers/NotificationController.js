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
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      rows = [user];
    } else {
      // Broadcast to ALL users
      const result = await query(
        `SELECT id, push_tokens FROM public.profiles WHERE banned = false`
      );
      rows = result.rows;
      if (!rows.length) {
        return res.status(404).json({ error: 'No users found' });
      }
    }

    // Store in-app notification for all recipients
    let storedCount = 0;
    for (const user of rows) {
      try {
        await query(
          `INSERT INTO public.notifications (user_id, title, body, type, read, created_at) VALUES ($1, $2, $3, 'broadcast', false, NOW())`,
          [user.id, title, body]
        );
        storedCount++;
      } catch (e) {
        // Try alternate schema
        try {
          await query(
            `INSERT INTO public.notifications (user_id, title, message, type, read, created_at) VALUES ($1, $2, $3, 'broadcast', false, NOW())`,
            [user.id, title, body]
          );
          storedCount++;
        } catch (_) {}
      }
    }

    // Send push notifications to users with tokens
    const uniqueTokens = new Set();
    for (const user of rows) {
      if (Array.isArray(user.push_tokens)) {
        for (const token of user.push_tokens) {
          if (typeof token === 'string' && token.trim()) uniqueTokens.add(token.trim());
        }
      }
    }

    let sentCount = 0;
    const results = [];
    for (const token of uniqueTokens) {
      try {
        const result = await sendPushNotificationToToken(token, title, body);
        results.push(result);
        if (result?.ok) sentCount++;
      } catch (e) {
        results.push({ ok: false, error: e.message });
      }
    }

    console.log(`📢 Broadcast: ${storedCount} in-app notifications stored, ${sentCount}/${uniqueTokens.size} push sent`);

    res.json({
      success: true,
      count: sentCount,
      recipientCount: rows.length,
      pushTokenCount: uniqueTokens.size,
      inAppNotifications: storedCount,
      results,
      message: `Broadcast sent to ${rows.length} users (${sentCount} push, ${storedCount} in-app)`,
    });
  } catch (err) {
    console.error('Send broadcast notification error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

export const getPushHistory = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, title, body, COALESCE(body, message) as content, type, read, created_at
       FROM public.notifications
       WHERE type = 'broadcast'
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json({ success: true, history: result.rows });
  } catch (err) {
    // Try alternate schema
    try {
      const result = await query(
        `SELECT id, user_id, title, message as content, type, read, created_at
         FROM public.notifications
         WHERE type = 'broadcast'
         ORDER BY created_at DESC
         LIMIT 50`
      );
      res.json({ success: true, history: result.rows });
    } catch (e) {
      res.json({ success: true, history: [] });
    }
  }
};
