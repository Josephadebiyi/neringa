import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Small delay for splash effect
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user has seen onboarding
        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (onboardingStatus === 'true') {
          // User has seen onboarding, go to sign in
          router.replace('/auth/signin');
        } else {
          // First time user, show onboarding
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error:', error);
        // On error, default to onboarding
        router.replace('/onboarding');
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

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
