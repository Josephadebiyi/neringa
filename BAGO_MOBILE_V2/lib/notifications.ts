import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
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

    if (finalStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission for push notifications was denied');
      return undefined;
    }

    try {
      const projectId = 'f59f4175-ebfc-441c-a1f0-da6e6456dd1f';
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: trigger || null, // null means immediate
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function dismissAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

// Notification types for the app
export const NotificationTypes = {
  PACKAGE_SHIPPED: 'package_shipped',
  PACKAGE_DELIVERED: 'package_delivered',
  PACKAGE_IN_TRANSIT: 'package_in_transit',
  NEW_MESSAGE: 'new_message',
  TRIP_REQUEST: 'trip_request',
  PAYMENT_RECEIVED: 'payment_received',
} as const;

/**
 * Send a package status notification
 */
export async function sendPackageNotification(
  type: keyof typeof NotificationTypes,
  packageName: string,
  status: string
) {
  const titles = {
    package_shipped: '📦 Package Shipped',
    package_delivered: '✅ Package Delivered',
    package_in_transit: '🚚 Package In Transit',
    new_message: '💬 New Message',
    trip_request: '✈️ New Trip Request',
    payment_received: '💰 Payment Received',
  };

  const bodies = {
    package_shipped: `Your package "${packageName}" has been shipped!`,
    package_delivered: `Package "${packageName}" has been delivered successfully!`,
    package_in_transit: `Package "${packageName}" is ${status}`,
    new_message: `You have a new message about "${packageName}"`,
    trip_request: `New request for your trip to ${packageName}`,
    payment_received: `Payment received for ${packageName}`,
  };

  const title = titles[type as keyof typeof titles];
  const body = bodies[type as keyof typeof bodies];

  await scheduleLocalNotification(
    title,
    body,
    { type, packageName, status }
  );
}
