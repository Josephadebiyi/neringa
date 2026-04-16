// Generated FirebaseOptions from GoogleService-Info.plist (bago-broadcast project)
// To regenerate: run `flutterfire configure` with the FlutterFire CLI

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

  // Android — uses same Firebase project. The appId MUST match the value from
  // google-services.json (mobilesdk_app_id for com.deracali.boltexponativewind).
  // If you regenerate google-services.json, update this value accordingly.
  //
  // HOW TO GET THE CORRECT ANDROID APP ID:
  // 1. Go to Firebase Console → Project Settings → Your Apps
  // 2. Find the Android app with package name "com.deracali.boltexponativewind"
  // 3. Copy the "App ID" value (format: 1:908126616288:android:XXXXXXXXXXXX)
  // 4. Also download google-services.json and place in android/app/
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCfEHIrHZmO4u3S5Murc6bKlVZEOYCkpW8',
    appId: '1:908126616288:android:a3b48ea93890202a086e85',
    messagingSenderId: '908126616288',
    projectId: 'bago-broadcast',
    storageBucket: 'bago-broadcast.firebasestorage.app',
  );
}
