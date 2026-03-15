import User from "../../models/userScheme.js";
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export const sendNotification = async (req, res) => {
    const { userId, title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'title and body are required' });
    }

    try {
        let users = [];

        if (userId) {
            // 🔹 Send to one specific user
            const user = await User.findById(userId);
            if (!user || !user.pushTokens?.length)
                return res.status(404).json({ error: 'No tokens for this user' });
            users = [user];
        } else {
            // 🔹 Get all users who have at least one valid Expo token
            const allUsers = await User.find({ pushTokens: { $exists: true, $ne: [] } });
            users = allUsers.filter(
                (u) =>
                    Array.isArray(u.pushTokens) &&
                    u.pushTokens.some((t) => Expo.isExpoPushToken(t))
            );
            if (!users.length)
                return res.status(404).json({ error: 'No users with valid push tokens' });
        }

        // ✅ Collect all unique valid tokens
        const uniqueTokens = new Set();
        for (const user of users) {
            if (Array.isArray(user.pushTokens)) {
                for (const token of user.pushTokens) {
                    if (Expo.isExpoPushToken(token)) {
                        uniqueTokens.add(token);
                    }
                }
            }
        }

        if (!uniqueTokens.size) {
            return res.status(404).json({ error: 'No valid Expo tokens to send to' });
        }

        // ✅ Group tokens by project (to handle multiple Expo projects if applicable)
        const projectGroups = {};
        for (const token of uniqueTokens) {
            const projectMatch = token.match(/\[(.*?)\]/);
            const projectId = projectMatch ? projectMatch[1].split(':')[0] : 'unknown';
            if (!projectGroups[projectId]) projectGroups[projectId] = [];
            projectGroups[projectId].push(token);
        }

        const allTickets = [];
        let sentCount = 0;

        for (const [projectId, tokens] of Object.entries(projectGroups)) {
            console.log(`🚀 Admin broadcasting ${tokens.length} notifications for project: ${projectId}`);

            const messages = tokens.map((token) => ({
                to: token,
                sound: 'default',
                title,
                body,
            }));

            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    allTickets.push(...ticketChunk);
                    sentCount += chunk.length;
                } catch (error) {
                    console.error(`❌ Error sending chunk for project ${projectId}:`, error);
                }
            }
        }

        res.json({
            success: true,
            count: sentCount,
            recipientCount: uniqueTokens.size,
            message: 'Broadcasting completed'
        });
    } catch (err) {
        console.error('Send broadcast notification error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
