// Generated FirebaseOptions from GoogleService-Info.plist (bago-broadcast project)
// To regenerate: run `flutterfire configure` with the FlutterFire CLI
// IMPORTANT: Restrict the API key in Google Cloud Console to this app's bundle ID
// (com.bago.app) to prevent abuse. See: https://console.cloud.google.com/apis/credentials

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) throw UnsupportedError('Web platform not supported.');
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCfEHIrHZmO4u3S5Murc6bKlVZEOYCkpW8',
    appId: '1:908126616288:ios:a3b48ea93890202a086e85',
    messagingSenderId: '908126616288',
    projectId: 'bago-broadcast',
    storageBucket: 'bago-broadcast.firebasestorage.app',
    iosBundleId: 'com.deracali.boltexponativewind',
  );

  // Android — uses same Firebase project as iOS.
  // IMPORTANT: If you haven't registered the Android app in Firebase Console yet:
  //   1. Go to Firebase Console → bago-broadcast project → Add app → Android
  //   2. Package name: com.deracali.boltexponativewind
  //   3. Download google-services.json → place in android/app/
  //   4. Update the appId below with the value from google-services.json (mobilesdk_app_id)
  //
  // The appId below is derived from the iOS config. Replace it with the real
  // Android appId from Firebase Console if different.
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCfEHIrHZmO4u3S5Murc6bKlVZEOYCkpW8',
    appId: '1:908126616288:android:a3b48ea93890202a086e85',
    messagingSenderId: '908126616288',
    projectId: 'bago-broadcast',
    storageBucket: 'bago-broadcast.firebasestorage.app',
  );
}
