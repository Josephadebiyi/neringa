// Web stubs for notification functions
// These are no-op implementations for web platform

export const NotificationTypes = {
  PACKAGE_SHIPPED: 'package_shipped',
  PACKAGE_DELIVERED: 'package_delivered',
  PACKAGE_IN_TRANSIT: 'package_in_transit',
  NEW_MESSAGE: 'new_message',
  TRIP_REQUEST: 'trip_request',
  PAYMENT_RECEIVED: 'payment_received',
} as const;

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  console.warn('Push notifications are not supported on web');
  return undefined;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: any
) {
  console.warn('Local notifications are not supported on web');
  // Could implement browser notifications here if needed
}

export async function cancelAllNotifications() {
  console.warn('Notifications are not supported on web');
}

export async function getBadgeCount(): Promise<number> {
  return 0;
}

export async function setBadgeCount(count: number) {
  console.warn('Badge count is not supported on web');
}

export async function dismissAllNotifications() {
  console.warn('Notifications are not supported on web');
}

export function addNotificationReceivedListener(listener: (notification: any) => void) {
  console.warn('Notification listeners are not supported on web');
  return { remove: () => {} };
}

export function addNotificationResponseReceivedListener(listener: (response: any) => void) {
  console.warn('Notification listeners are not supported on web');
  return { remove: () => {} };
}

export async function sendPackageNotification(
  type: keyof typeof NotificationTypes,
  packageName: string,
  status: string
) {
  console.warn('Package notifications are not supported on web');
  // Could implement browser notifications here if needed
}
