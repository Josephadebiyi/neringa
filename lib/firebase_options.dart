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

  // Android placeholder — update with your google-services.json values
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCfEHIrHZmO4u3S5Murc6bKlVZEOYCkpW8',
    appId: '1:908126616288:android:placeholder',
    messagingSenderId: '908126616288',
    projectId: 'bago-broadcast',
    storageBucket: 'bago-broadcast.firebasestorage.app',
  );
}
