import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function usePushNotifications() {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;

        registerForPushNotificationsAsync().then(token => {
            if (token) {
                // Send to backend
                api.post('/api/bago/push-token', { token }).catch(err => {
                    console.error('Failed to save push token on backend', err);
                });
            }
        });
    }, [isAuthenticated]);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#5845D8',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            try {
                const projectId = '76da7de1-baf8-43d9-9529-d50c76df912a'; // Ensure realistic fallback or from app.json
                // Wait! Let's get projectId dynamically from constants
                const Constants = require('expo-constants').default;
                const project = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId || projectId;

                token = (await Notifications.getExpoPushTokenAsync({ projectId: project })).data;
                console.log("EXPO PUSH TOKEN:", token);
            } catch (e) {
                console.log('Error getting push token', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }
}
