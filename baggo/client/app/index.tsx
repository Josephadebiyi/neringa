import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { backendomain } from '@/utils/backendDomain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const [apiUser, setApiUser] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingAndUser = async () => {
      try {
        // Check if user has seen onboarding
        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(onboardingStatus === 'true');

        // Fetch user data
        const response = await fetch(`${backendomain.backendomain}/api/baggo/getUser`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (data.user && data.user._id) {
          const userData = {
            id: data.user._id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            phone: data.user.phone,
            banned: data.user.banned,
          };
          setApiUser(userData);
          setIsBanned(data.user.banned);
        } else {
          setFetchError(true);
        }
      } catch (error) {
        console.error('Error:', error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingAndUser();
  }, []);

  useEffect(() => {
    if (!loading && hasSeenOnboarding !== null) {
      // If user hasn't seen onboarding, show it first
      if (!hasSeenOnboarding) {
        router.replace('/onboarding');
        return;
      }

      // Otherwise proceed with normal flow
      if (isBanned) {
        router.replace('/banned');
      } else if (apiUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/signin');
      }
    }
  }, [apiUser, isBanned, loading, hasSeenOnboarding, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/bago-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {loading && (
        <ActivityIndicator
          size="large"
          color="#6366F1"
          style={styles.spinner}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
