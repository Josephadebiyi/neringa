import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../lib/notifications';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      register();
    }

    // Listen for notifications while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification: any) => {
      console.log('🔔 Notification Received:', notification);
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      console.log('👆 Notification Tapped:', data);
      
      // Handle navigation based on notification data
      if (data?.type === 'new_message') {
         // router.push('/messages/...')
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, user]);

  const register = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        // Send to backend
        await api.post('/api/bago/register-token', { token });
        console.log('✅ Push token stored in backend');
      }
    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error);
    }
  };

  return null;
}
