import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '@/utils/api';

// Configure how notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PushNotificationSetup() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [userId, setUserId] = useState('');

  /**
   * Main setup: register token and listen for notifications
   */
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Use the API utility to get the profile
        const profileRes = await api.get('/api/bago/Profile');
        if (profileRes.data?.data?.findUser?._id) {
          const uId = profileRes.data.data.findUser._id;
          setUserId(uId);
          console.log('✅ Found User ID for Push:', uId);

          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token);
            console.log('✅ Expo Push Token Identified:', token);

            // Register token with backend using global API instance
            const res = await api.post('/register-token', { userId: uId, token });
            console.log('📬 Token registration response:', res.data);
          }
        }
      } catch (err) {
        console.error('❌ Push setup failed:', err);
      }
    };

    setupNotifications();

    // Listen for notifications while app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📩 Notification received:', notification);
    });

    return () => subscription.remove();
  }, []);

  // 🔇 Return null → nothing renders on screen
  return null;
}

/**
 * Ask permission and get Expo Push Token
 */
async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permission denied for push notifications');
      return;
    }

    // ⚠️ Use YOUR OWN Expo projectId here
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: 'f59f4175-ebfc-441c-a1f0-da6e6456dd1f',
      })
    ).data;
  } else {
    console.warn('⚠️ Must use a physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
