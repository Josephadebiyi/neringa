import { Expo } from 'expo-server-sdk';
import User from '../models/userScheme.js';
import { Notification } from '../models/notificationScheme.js';

const expo = new Expo();

export const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushTokens || user.pushTokens.length === 0) {
            console.log(`No push tokens found for user ${userId}`);
            // Still save to database notification
            await Notification.create({
                user: userId,
                message: `${title}: ${body}`,
            });
            return;
        }

        const messages = [];
        for (const pushToken of user.pushTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title,
                body,
                data,
            });
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }

        // Save to database notification
        await Notification.create({
            user: userId,
            message: `${title}: ${body}`,
        });

        return tickets;
    } catch (error) {
        console.error('Error in sendPushNotification service:', error);
    }
};
