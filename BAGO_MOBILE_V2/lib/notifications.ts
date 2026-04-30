import { Platform } from 'react-native';

let Notifications: any = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (_) {}
}

export function addNotificationReceivedListener(handler: (n: any) => void) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseReceivedListener(handler: (r: any) => void) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || Platform.OS === 'web') return null;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (_) {
    return null;
  }
}
