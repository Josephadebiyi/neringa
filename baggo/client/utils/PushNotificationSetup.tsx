import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { backendomain } from '@/utils/backendDomain';

// Configure how notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationManager() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [userId, setUserId] = useState('');

  const base =
    typeof backendomain === 'object' && backendomain.backendomain
      ? backendomain.backendomain
      : backendomain || "http://172.20.10.3:3000";

  /**
   * Fetch user ID
   */
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${base}/api/baggo/Profile`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data?.data?.findUser?._id) {
        setUserId(data.data.findUser._id);
        console.log('👤 User ID:', data.data.findUser._id);
      } else {
        console.warn('⚠️ No user found in profile data');
      }
    } catch (err) {
      console.error('❌ Failed to fetch user profile:', err);
    }
  };

  /**
   * Main setup: register token and listen for notifications
   */
  useEffect(() => {
    const setupNotifications = async () => {
      await fetchUserProfile();
      if (!userId) return;

      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        console.log('✅ Expo Push Token:', token);

        try {
          const res = await fetch(`${base}/register-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token }),
          });
          const data = await res.json();
          console.log('📬 Token registration response:', data);
        } catch (err) {
          console.error('❌ Token registration failed:', err);
        }
      }

      // Listen for notifications while app is foregrounded
      const subscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification received:', notification);
      });

      return () => subscription.remove();
    };

    setupNotifications();
  }, [userId]);

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
        projectId: 'b11b74ac-d95e-4ea5-8cf7-0bb68eff100e',
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
