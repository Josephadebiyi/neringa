import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Platform, Animated, View, Image, StyleSheet, Dimensions } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
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

// Safe font loading to prevent build errors if packages are missing
let useFonts: any = () => [true];
try {
  // Use a dynamic check if possible, or just default to system fonts
  // for now to clear the build error.
} catch (e) {}

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
  // Graceful fallback if libraries are not installed
  let fontsLoaded = true;
  try {
    const fonts = useFonts({}); // Use the mock or real if it's there
    fontsLoaded = fonts[0];
  } catch (e) {
    fontsLoaded = true;
  }

  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stackAnims = [
    useRef(new Animated.Value(0.1)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.1)).current,
  ];

  useEffect(() => {
    // Sequence the stack fade in
    const animations = stackAnims.map((anim, i) => 
      Animated.timing(anim, {
        toValue: (i === 2) ? 1 : 0.3 - (Math.abs(2-i)*0.1),
        duration: 800,
        delay: i * 100,
        useNativeDriver: true,
      })
    );

    Animated.sequence([
      Animated.stagger(100, animations),
      Animated.delay(1000),
      Animated.parallel([
        ...stackAnims.map((anim, i) => 
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      setIsReady(true);
    });

    if (Platform.OS === 'web') {
      setIsReady(true);
      return;
    };

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

  if (!fontsLoaded || (!isReady && Platform.OS !== 'web')) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        <View style={styles.stackWrapper}>
          {stackAnims.map((anim, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.logoStackItem, 
                { opacity: anim, transform: [{ translateY: (i - 2) * 20 }] }
              ]}
            >
              <Image 
                source={require('../assets/bago-logo.png')} 
                style={styles.splashLogo} 
                resizeMode="contain" 
              />
            </Animated.View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContent>
        <AuthProvider>
          <AuthNavigationWrapper>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
            </Stack>
          </AuthNavigationWrapper>
        </AuthProvider>
      </AppContent>
    </SafeAreaProvider>
  );
}

function AuthNavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to onboarding if not authenticated and not already in auth flow
      router.replace('/');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated but in auth flow
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF', // Matching primaryLighter
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStackItem: {
    position: 'absolute',
  },
  splashLogo: {
    width: 150,
    height: 60,
  },
});
