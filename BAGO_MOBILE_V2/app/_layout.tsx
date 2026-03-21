import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../lib/notifications';

export default function RootLayout() {
  const notificationListener = useRef<ReturnType<typeof addNotificationReceivedListener>>();
  const responseListener = useRef<ReturnType<typeof addNotificationResponseReceivedListener>>();

  useEffect(() => {
    // Listen for notifications while app is open
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show an in-app notification or update UI here
    });

    // Listen for user tapping on notifications
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Navigate to relevant screen based on notification data
      // TODO: Add navigation logic based on notification type
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9FAFB' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>
    </SafeAreaProvider>
  );
}
