import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Search, Package, Bell, User } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendomain } from '@/utils/backendDomain';

const API_BASE_URL = `${backendomain.backendomain}/api/baggo`;

export default function TrackingScreen(): JSX.Element {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState('');
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({}); // shortCode -> requestId

  useEffect(() => {
    const initializeTracking = async () => {
      const storedMap = await loadTrackingMap(); // 🔴 capture map
      await fetchRecentOrders(storedMap);
    };

    initializeTracking();
  }, []);


  const loadTrackingMap = async (): Promise<Record<string, string>> => {
  try {
    const stored = await AsyncStorage.getItem('trackingMap');
    if (stored) {
      const parsed = JSON.parse(stored);
      setTrackingMap(parsed);
      return parsed; // 🔴 IMPORTANT
    }
  } catch (error) {
    console.error('Error loading tracking map:', error);
  }
  return {};
};


  const saveTrackingMap = async (newMap: Record<string, string>) => {
    try {
      await AsyncStorage.setItem('trackingMap', JSON.stringify(newMap));
      setTrackingMap(newMap);
    } catch (error) {
      console.error('Error saving tracking map:', error);
    }
  };

  // Generate codes like BG-482-242
  const generateUniqueTrackingCode = (existingCodes: string[]) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let newCode = '';
    do {
      const part1 =
        letters.charAt(Math.floor(Math.random() * letters.length)) +
        letters.charAt(Math.floor(Math.random() * letters.length)); // Two letters
      const part2 = Math.floor(100 + Math.random() * 900); // 3-digit
      const part3 = Math.floor(100 + Math.random() * 900); // 3-digit
      newCode = `${part1}-${part2}-${part3}`;
    } while (existingCodes.includes(newCode));
    return newCode;
  };

  // Ensure we don't assign multiple short codes to the same requestId
  const assignTrackingCodesToRecentOrders = async (
    orders: any[],
    currentMap: Record<string, string>
  ) => {
    const newMap = { ...currentMap };
    const existingCodes = Object.keys(newMap);
    let hasChanges = false;

    orders.forEach((order) => {
      const requestId = order.requestId;
      // if this requestId is not present in values, assign
      const alreadyAssigned = Object.values(newMap).includes(requestId);
      if (!alreadyAssigned) {
        const shortCode = generateUniqueTrackingCode(existingCodes);
        newMap[shortCode] = requestId;
        existingCodes.push(shortCode);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await saveTrackingMap(newMap);
    }
    return newMap;
  };

  const fetchRecentOrders = async (currentMap: Record<string, string>) => {
    setLoadingOrders(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/recentOrder`, {
        withCredentials: true,
      });
      if (response.data.success && Array.isArray(response.data.data)) {
        const orders = response.data.data;
        setRecentOrders(orders);
        const updatedMap = await assignTrackingCodesToRecentOrders(orders, currentMap);
        setTrackingMap(updatedMap);
      } else {
        setRecentOrders([]);
      }
    } catch (error: any) {
      // Silently handle all errors - just show empty state
      setRecentOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // If user typed a short code (BG-123-456) return the mapped requestId, otherwise assume they typed requestId.
  const getRequestIdFromInput = (input: string) => {
    const trimmed = input.trim();
    if (/^[A-Z]{2}-\d{3}-\d{3}$/.test(trimmed)) {
      return trackingMap[trimmed] || null;
    }
    return trimmed;
  };

  const handleTrack = async () => {
    if (!trackingInput) {
      alert('Please enter a tracking code (e.g., BG-482-242)');
      return;
    }

    const requestId = getRequestIdFromInput(trackingInput);

    if (!requestId) {
      alert('Invalid tracking code');
      return;
    }

    const matchedOrder = recentOrders.find((o) => o.requestId === requestId);
    if (!matchedOrder) {
      alert('Order not found in recent orders');
      return;
    }

    // If user typed a raw requestId (not a short code) ensure a short code exists for it
    const isShortCode = /^[A-Z]{2}-\d{3}-\d{3}$/.test(trackingInput);
    if (!isShortCode) {
      const alreadyAssigned = Object.values(trackingMap).includes(requestId);
      if (!alreadyAssigned) {
        const existingCodes = Object.keys(trackingMap);
        const shortCode = generateUniqueTrackingCode(existingCodes);
        const newMap = { ...trackingMap, [shortCode]: requestId };
        await saveTrackingMap(newMap);
      }
    }

    router.push({
      pathname: '/package-details',
      params: { requestId },
    });
  };

  const getDisplayTracking = (order: any) => {
    const shortCode = Object.keys(trackingMap).find(
      (code) => trackingMap[code] === order.requestId
    );
    return shortCode || order.requestId;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Track Package</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={20} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
              <User size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.trackingCard}>
          <View style={styles.trackingIllustration}>
            <Package size={48} color={Colors.gold} strokeWidth={1.5} />
          </View>

          <Text style={styles.trackingTitle}>Track your package!</Text>
          <Text style={styles.trackingSubtitle}>
            Enter your tracking code (e.g., BG-482-242)
          </Text>

          {/* Input row */}
          <View style={styles.trackingInputContainer}>
            <Search size={20} color={Colors.textLight} />
            <TextInput
              style={styles.trackingInput}
              placeholder="BG-482-242"
              placeholderTextColor={Colors.textMuted}
              value={trackingInput}
              onChangeText={setTrackingInput}
            />
          </View>

          {/* Track button (outside input container) */}
          <TouchableOpacity style={styles.trackButton} onPress={handleTrack}>
            <Text style={styles.trackButtonText}>Track Package</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Tracking</Text>
          <Text style={styles.sectionSubtitle}>Your recently tracked packages</Text>

          {loadingOrders ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
          ) : recentOrders.length === 0 ? (
            <Text style={styles.noOrdersText}>No recent orders found</Text>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.requestId}
                style={styles.recentCard}
                onPress={() =>
                  router.push({
                    pathname: '/package-details',
                    params: { requestId: order.requestId },
                  })
                }
              >
                <View style={styles.recentIcon}>
                  <Package size={24} color={Colors.primary} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {order.package?.description || 'No description'}
                  </Text>
                  <Text style={styles.recentTracking}>Tracking: {getDisplayTracking(order)}</Text>
                  <Text
                    style={[
                      styles.recentStatus,
                      {
                        color:
                          order.status === 'pending'
                            ? Colors.warning
                            : order.status === 'accepted' || order.status === 'inTransit'
                            ? Colors.success
                            : order.status === 'delivered'
                            ? Colors.primary
                            : order.status === 'rejected'
                            ? Colors.error
                            : Colors.textLight,
                      },
                    ]}
                  >
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}


// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  trackingCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  trackingIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  trackingSubtitle: {
    fontSize: 15,
    color: Colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  trackingInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    marginBottom: 20,
  },
  trackingInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  trackButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  recentSection: {
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recentTracking: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  recentStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  spinner: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  noOrdersText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginVertical: 20,
  },
});
