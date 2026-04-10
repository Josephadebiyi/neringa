import User from "../../models/userScheme.js";
import { sendPushNotificationToToken } from '../../services/pushNotificationService.js';

export const sendNotification = async (req, res) => {
    const { userId, title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'title and body are required' });
    }

    try {
        let users = [];

        if (userId) {
            const user = await User.findById(userId);
            if (!user || !user.pushTokens?.length) {
                return res.status(404).json({ error: 'No tokens for this user' });
            }
            users = [user];
        } else {
            const allUsers = await User.find({ pushTokens: { $exists: true, $ne: [] } });
            users = allUsers.filter((u) => Array.isArray(u.pushTokens) && u.pushTokens.length > 0);
            if (!users.length) {
                return res.status(404).json({ error: 'No users with push tokens' });
            }
        }

        const uniqueTokens = new Set();
        for (const user of users) {
            if (Array.isArray(user.pushTokens)) {
                for (const token of user.pushTokens) {
                    if (typeof token === 'string' && token.trim()) {
                        uniqueTokens.add(token.trim());
                    }
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
            if (result?.ok) {
                sentCount += 1;
            }
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
