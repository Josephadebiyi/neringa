import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import config from '../lib/config';

// Conditionally load native-only modules
let StripeProvider: any = null;
let addNotificationReceivedListener: any = null;
let addNotificationResponseReceivedListener: any = null;

if (Platform.OS !== 'web') {
  try {
    StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
  } catch (e) {
    console.warn('Stripe not available:', e);
  }
  try {
    const notif = require('../lib/notifications');
    addNotificationReceivedListener = notif.addNotificationReceivedListener;
    addNotificationResponseReceivedListener = notif.addNotificationResponseReceivedListener;
  } catch (e) {
    console.warn('Notifications not available:', e);
  }
}

function AppContent({ children }: { children: React.ReactNode }) {
  // Wrap with StripeProvider only on native
  if (StripeProvider && Platform.OS !== 'web') {
    return (
      <StripeProvider publishableKey={config.stripeKey}>
        {children}
      </StripeProvider>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let notifSub: any;
    let responseSub: any;

    if (addNotificationReceivedListener) {
      notifSub = addNotificationReceivedListener((notification: any) => {
        console.log('Notification received:', notification);
      });
    }
    if (addNotificationResponseReceivedListener) {
      responseSub = addNotificationResponseReceivedListener((response: any) => {
        console.log('Notification tapped:', response);
      });
    }

    return () => {
      notifSub?.remove();
      responseSub?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppContent>
        <AuthProvider>
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
        </AuthProvider>
      </AppContent>
    </SafeAreaProvider>
  );
}
