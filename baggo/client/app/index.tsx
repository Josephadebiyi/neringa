import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { backendomain } from '@/utils/backendDomain';

export default function Index() {
  const router = useRouter();
  const [apiUser, setApiUser] = useState(null); // Local state for API-fetched user
  const [isBanned, setIsBanned] = useState(false); // Track ban status
  const [loading, setLoading] = useState(true); // Local loading state
  const [fetchError, setFetchError] = useState(false); // Track API fetch errors

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${backendomain.backendomain}/api/baggo/getUser`, {
          method: 'GET',
          credentials: 'include', // Include auth cookie
        });
        const data = await response.json();

        if (data.user && data.user._id) {
          // Map API user data to match expected user object structure
          const userData = {
            id: data.user._id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            phone: data.user.phone,
            banned: data.user.banned, // Include banned status
          };
          setApiUser(userData); // Store user data
          setIsBanned(data.user.banned); // Set ban status
        } else {
          // console.warn('Invalid user data from API');
          setFetchError(true);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (isBanned) {
        router.replace('/banned'); // Navigate to BannedUserScreen if banned
      } else if (apiUser) {
        router.replace('/(tabs)'); // Navigate to tabs if not banned and logged in
      } else {
        router.replace('/auth/signin'); // Navigate to sign-in if no user data
      }
    }
  }, [apiUser, isBanned, loading, router]);

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.spinner}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    alignSelf: 'center',
  },
});
