import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useFrameworkReady() {
  useEffect(() => {
    // Only relevant for web platform - no-op on native
    if (Platform.OS === 'web') {
      // Web-specific framework ready logic would go here
      // For React Native iOS/Android, this is a no-op
    }
  }, []);
}
