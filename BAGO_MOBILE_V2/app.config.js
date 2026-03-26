// app.config.js — reads env vars at build time for dynamic values.
// Static values (bundle ID, permissions, etc.) are inlined here.
// Sensitive config is read from EXPO_PUBLIC_* env vars.

const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
// The Google iOS URL scheme is the reversed client ID — required for OAuth redirect
const googleIosUrlScheme = iosGoogleClientId
  ? `com.googleusercontent.apps.${iosGoogleClientId.split('.apps.googleusercontent.com')[0]}`
  : 'com.googleusercontent.apps.placeholder';

export default {
  expo: {
    name: 'Bago',
    slug: 'bolt-expo-nativewind',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'com.bago.mobile',
    runtimeVersion: {
      policy: 'appVersion',
    },
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#5C4BFD',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.deracali.boltexponativewind',
      buildNumber: '33',
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              'com.bago.mobile',
              googleIosUrlScheme,
            ],
          },
        ],
        NSUserTrackingUsageDescription:
          'This identifier will be used to send you personalized notifications.',
        NSLocationWhenInUseUsageDescription:
          'This app needs access to your location to detect your country and currency',
        NSCameraUsageDescription:
          'This app needs access to your camera to scan QR codes and take photos',
        NSPhotoLibraryUsageDescription:
          'This app needs access to your photo library to select images',
        UIBackgroundModes: ['remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.deracali.boltexponativewind',
      adaptiveIcon: {
        backgroundColor: '#5C4BFD',
        foregroundImage: './assets/icon.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#5C4BFD',
        },
      ],
      '@stripe/stripe-react-native',
      './plugins/withFollyCoroutinesFix',
    ],
    extra: {
      // All values from env — nothing hardcoded
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      iosGoogleClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      androidGoogleClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
      router: {},
      eas: {
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID || 'f59f4175-ebfc-441c-a1f0-da6e6456dd1f',
      },
    },
    owner: 'donnyace',
  },
};
