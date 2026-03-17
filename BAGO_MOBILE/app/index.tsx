import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '@/utils/api';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // Small delay for splash effect
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check for existing authentication session with individual try-catch
        let storedToken = null;
        let storedUser = null;

        try {
          storedToken = await getToken();
        } catch (err) {
          console.log('Error getting token:', err);
        }

        try {
          storedUser = await AsyncStorage.getItem('user');
        } catch (err) {
          console.log('Error getting user:', err);
        }

        // If user is already authenticated, go directly to main app
        if (storedToken && storedUser) {
          console.log('Existing session found, navigating to main app');
          router.replace('/(tabs)');
          return;
        }

        // Check if user has seen onboarding
        let onboardingStatus = null;
        try {
          onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        } catch (err) {
          console.log('Error getting onboarding status:', err);
        }

        if (onboardingStatus === 'true') {
          // User has seen onboarding but not authenticated, go to sign in
          router.replace('/auth/signin');
        } else {
          // First time user, show onboarding
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Critical error in index:', error);
        // On error, default to onboarding safely
        try {
          router.replace('/onboarding');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <Image
        source={require('@/assets/images/bago-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {loading && (
        <ActivityIndicator
          size="large"
          color={'#5845D8'}
          style={styles.spinner}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  },
});
