import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Plane, Calendar, Package, TrendingUp, ChevronLeft } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';
import api from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




export default function TravelerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [trips, setTrips] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState<any | null>(null);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [symbol, setSymbol] = useState("₦");
  const [country, setCountry] = useState<string | null>(null);
  const [isNigeria, setIsNigeria] = useState(false);

  const [currency, setCurrency] = useState('EUR');

  const CURRENCY_KEY = "userCurrency";
  const saveCurrency = async (value: string) => {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, value);
    } catch (err) {
      console.error("Error saving currency:", err);
    }
  };

  const loadCurrency = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(CURRENCY_KEY);
    } catch (err) {
      console.error("Error loading currency:", err);
      return null;
    }
  };


  const currencySymbols = {
    // Eurozone countries (EUR)
    EUR: "€",
    AT: "€",
    BE: "€",
    CY: "€",
    EE: "€",
    FI: "€",
    FR: "€",
    DE: "€",
    GR: "€",
    IE: "€",
    IT: "€",
    LV: "€",
    LT: "€",
    LU: "€",
    MT: "€",
    NL: "€",
    PT: "€",
    SK: "€",
    SI: "€",
    ES: "€",

    // Africa
    NGN: "₦",
    GHS: "₵",
    KES: "KSh",
    ZAR: "R",
    EGP: "£",
    TZS: "TSh",
    UGX: "USh",
    MAD: "DH",
    DZD: "DA",
    SDG: "£",
    XOF: "CFA",
    XAF: "FCFA",

    // Americas
    USD: "$",
    CAD: "CA$",
    MXN: "$",
    BRL: "R$",
    ARS: "$",
    CLP: "$",
    COP: "$",
    PEN: "S/",
    UYU: "$U",

    // Asia & Others
    INR: "₹",
    CNY: "¥",
    JPY: "¥",
    RUB: "₽",
    TRY: "₺",
    AED: "د.إ",
    SGD: "S$",
    AUD: "A$",
    NZD: "NZ$",
    CHF: "CHF",

    // ✅ Add GBP
    GBP: "£",   // United Kingdom
  };


  useEffect(() => {
    (async () => {
      try {
        // Load saved storage values
        const savedCurrency = await loadCurrency();   // e.g. "USD"
        const savedCountryName = await AsyncStorage.getItem("userCountry"); // e.g. "Nigeria"

        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');

          // fallback to saved or default
          setCurrency(savedCurrency || "NGN");
          setCountry(savedCountryName || "Nigeria");
          setSymbol((currencySymbols as any)[savedCurrency as any] || "₦");
          setLoading(false);
          return;
        }

        // Get current position
        const loc = await Location.getCurrentPositionAsync({});

        // Reverse geocode to get country info
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        let detectedCountryName = savedCountryName || "Nigeria";
        let detectedCurrency = savedCurrency || "NGN";

        if (reverse.length > 0) {
          const countryCode = reverse[0].isoCountryCode || 'NG';
          const countryName = reverse[0].country || 'Nigeria';

          // Map country code to currency
          switch (countryCode) {
            case 'NG': detectedCurrency = 'NGN'; break;
            case 'GH': detectedCurrency = 'GHS'; break;
            case 'KE': detectedCurrency = 'KES'; break;
            case 'ZA': detectedCurrency = 'ZAR'; break;
            case 'EG': detectedCurrency = 'EGP'; break;
            case 'TZ': detectedCurrency = 'TZS'; break;
            case 'UG': detectedCurrency = 'UGX'; break;
            case 'MA': detectedCurrency = 'MAD'; break;
            case 'DZ': detectedCurrency = 'DZD'; break;
            case 'SD': detectedCurrency = 'SDG'; break;
            case 'FR': case 'DE': case 'IT': case 'ES': case 'PT': case 'NL':
            case 'LU': case 'BE': case 'IE': case 'GR': case 'FI': case 'EE':
            case 'LT': case 'LV': case 'CY': case 'MT': case 'SK': case 'SI':
              detectedCurrency = 'EUR'; break;
            case 'GB': detectedCurrency = 'GBP'; break;
            case 'CA': detectedCurrency = 'CAD'; break;
            case 'MX': detectedCurrency = 'MXN'; break;
            case 'BR': detectedCurrency = 'BRL'; break;
            case 'AR': detectedCurrency = 'ARS'; break;
            case 'CL': detectedCurrency = 'CLP'; break;
            case 'CO': detectedCurrency = 'COP'; break;
            case 'PE': detectedCurrency = 'PEN'; break;
            case 'UY': detectedCurrency = 'UYU'; break;
            case 'IN': detectedCurrency = 'INR'; break;
            case 'CN': detectedCurrency = 'CNY'; break;
            case 'JP': detectedCurrency = 'JPY'; break;
            case 'RU': detectedCurrency = 'RUB'; break;
            case 'TR': detectedCurrency = 'TRY'; break;
            case 'AE': detectedCurrency = 'AED'; break;
            case 'SG': detectedCurrency = 'SGD'; break;
            case 'AU': detectedCurrency = 'AUD'; break;
            case 'NZ': detectedCurrency = 'NZD'; break;
            case 'CH': detectedCurrency = 'CHF'; break;
            default: detectedCurrency = 'NGN';
          }

          detectedCountryName = countryName;

          // Update AsyncStorage only if country changed
          if (savedCountryName !== countryName) {
            await saveCurrency(detectedCurrency);
            await AsyncStorage.setItem("userCountry", countryName);
          }
        }

        // Update state
        setCountry(detectedCountryName);
        setCurrency(detectedCurrency);
        setSymbol((currencySymbols as any)[detectedCurrency] || '₦');
        setIsNigeria(detectedCurrency === 'NGN');

        console.log('Detected Country:', detectedCountryName);
        console.log('Currency:', detectedCurrency, currencySymbols[detectedCurrency]);

      } catch (err) {
        console.error('Location detection error:', err);
        // fallback to saved or default
        setCurrency("NGN");
        setCountry("Nigeria");
        setSymbol("₦");
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  // ✅ Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/bago/getUser');
        const data = response.data;

        if (data.user) {
          setApiUser(data.user);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));

          if (typeof data.user.balance === 'number') {
            setWalletBalance(data.user.balance);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching user profile:', err);
      }
    };
    fetchUser();
  }, []);

  // ✅ Fetch wallet + trips
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wallet balance
        const walletResponse = await api.get('/api/bago/getWallet');
        const walletData = walletResponse.data;
        if (walletData.success) {
          const available = Number(walletData.data?.balance ?? walletData.balance ?? 0);
          const escrow = Number(walletData.data?.escrowBalance ?? walletData.escrowBalance ?? 0);
          setWalletBalance(!Number.isNaN(available) ? available : 0);
          setEscrowBalance(!Number.isNaN(escrow) ? escrow : 0);
        } else {
          setWalletBalance(0);
          setEscrowBalance(0);
        }

        // Trips
        const tripsResponse = await api.get('/api/bago/MyTrips');
        const tripsData = tripsResponse.data;
        if (tripsData.message === 'Trips retrieved successfully' && Array.isArray(tripsData.trips)) {
          const mapped = tripsData.trips
            .map((trip: any) => ({
              _id: trip._id || trip.id,
              from: trip.fromLocation,
              to: trip.toLocation,
              date: trip.departureDate,
              capacity: trip.availableKg,
              used: 0,
              requests: trip.request,
              earnings: trip.availableKg * trip.pricePerKg,
              status: trip.status || 'pending',
              createdAt: trip.createdAt,
            }))
            .filter((t: any) => t._id);
          setTrips(mapped);
        } else setTrips([]);
      } catch (err) {
        console.error('Error fetching trips/wallet:', err);
        setTrips([]);
        setWalletBalance(0);
        setEscrowBalance(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Fetch completed trips (separate endpoint)
  useEffect(() => {
    if (!apiUser) return;
    const fetchCompleted = async () => {
      setCompletedLoading(true);
      try {
        const res = await api.get(`/api/bago/completed/${apiUser._id}`);
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          const completed = data.data.map((req: any) => ({
            _id: req._id,
            from: req.package?.fromCity || req.package?.fromCountry || 'Unknown',
            to: req.package?.toCity || req.package?.toCountry || 'Unknown',
            date: req.updatedAt || req.createdAt,
            description: req.package?.description || 'No description',
            weight: req.package?.packageWeight || 0,
            value: req.package?.value || 0,
            status: 'completed',
          }));
          setCompletedTrips(completed);
        } else setCompletedTrips([]);
      } catch (err) {
        console.error('Error fetching completed trips:', err);
        setCompletedTrips([]);
      } finally {
        setCompletedLoading(false);
      }
    };
    fetchCompleted();
  }, [apiUser]);

  const handleDeleteTrip = async (tripId: string) => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/bago/Trip/${tripId}`);
              setTrips(prev => prev.filter(t => t._id !== tripId));
              Alert.alert("Success", "Trip deleted successfully");
            } catch (err) {
              Alert.alert("Error", "Failed to delete trip");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={'#5845D8'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#5845D8', '#4534B8']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={'#FFFFFF'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Wallet Card */}
      <View style={styles.statsCard}>
        <LinearGradient colors={['#F5C563', '#E8B86D']} style={styles.statGradient}>
          <TrendingUp size={32} color={'#FFFFFF'} />
          <Text style={styles.statValue}>
            {symbol}
            {walletBalance
              ? walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "0.00"}
          </Text>

          <Text style={styles.statLabel}>Wallet Balance</Text>
          <Text style={styles.escrowText}>
            Held in Escrow: {symbol}
            {escrowBalance
              ? escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "0.00"}
          </Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{completedTrips.length}</Text>
            <Text style={styles.miniStatLabel}>Delivered</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>0</Text>
            <Text style={styles.miniStatLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'active'
          ? trips.length === 0
            ? <Text style={styles.noTripsText}>No active trips found.</Text>
            : trips.map(trip => (
              <TouchableOpacity key={trip._id} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <View style={styles.tripIcon}>
                    <Plane size={20} color={'#5845D8'} />
                  </View>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                    <View style={styles.tripDate}>
                      <Calendar size={14} color={'#6B6B6B'} />
                      <Text style={styles.tripDateText}>
                        {new Date(trip.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.tripStats}>
                  <View style={styles.tripStat}>
                    <Package size={16} color={'#6B6B6B'} />
                    <Text style={styles.tripStatText}>
                      {trip.used}/{trip.capacity} kg used
                    </Text>
                  </View>
                  <View style={styles.tripStat}>
                    <View style={[styles.statusBadge,
                    trip.status === 'active' ? styles.statusActive :
                      trip.status === 'pending' ? styles.statusPending :
                        styles.statusDeclined
                    ]}>
                      <Text style={[styles.statusText,
                      trip.status === 'active' ? styles.statusTextActive :
                        trip.status === 'pending' ? styles.statusTextPending :
                          styles.statusTextDeclined
                      ]}>
                        {trip.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.tripFooter, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.editButton, !trip._id && styles.disabledButton]}
                      onPress={() =>
                        trip._id &&
                        router.push(`/edit-trip?id=${trip._id}&date=${trip.createdAt || trip.date}`)
                      }
                      disabled={!trip._id}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTrip(trip._id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.viewButton, !trip._id && styles.disabledButton]}
                    onPress={() => trip._id && router.push(`/package-request?id=${trip._id}`)}
                    disabled={!trip._id}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>



              </TouchableOpacity>



            ))
          : completedLoading
            ? <ActivityIndicator />
            : completedTrips.length === 0
              ? <Text style={styles.noTripsText}>No completed trips found.</Text>
              : completedTrips.map(trip => (
                <View key={trip._id} style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripIcon}>
                      <Package size={20} color={'#5845D8'} />
                    </View>
                    <View style={styles.tripInfo}>
                      <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                      <View style={styles.tripDate}>
                        <Calendar size={14} color={'#6B6B6B'} />
                        <Text style={styles.tripDateText}>
                          {new Date(trip.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.tripStatText}>{trip.weight} kg — {trip.description}</Text>
                  <Text style={styles.earningsText}>Value: <Text style={styles.earningsValue}>€{trip.value}</Text></Text>
                </View>
              ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-trip')}>
        <Plus size={24} color={'#FFFFFF'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F3' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  statsCard: {
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statGradient: { padding: 24, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.95 },
  escrowText: { fontSize: 13, color: '#FFFFFF', opacity: 0.9, marginTop: 6 },
  statsGrid: { flexDirection: 'row', backgroundColor: '#FFFFFF' },
  miniStat: { flex: 1, padding: 16, alignItems: 'center' },
  miniStatValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  miniStatLabel: { fontSize: 12, color: '#6B6B6B' },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#5845D8' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B6B6B' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20 },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tripHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tripIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FDF9F1', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  tripInfo: { flex: 1 },
  tripRoute: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  tripDate: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripDateText: { fontSize: 13, color: '#6B6B6B' },
  tripStats: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  tripStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripStatText: { fontSize: 13, color: '#6B6B6B' },
  requestBadge: {
    fontSize: 12, fontWeight: '600', color: '#5845D8',
    backgroundColor: '#FDF9F1', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsText: { fontSize: 14, color: '#6B6B6B' },
  earningsValue: { fontSize: 16, fontWeight: 'bold', color: '#5845D8' },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5845D8',
    alignSelf: "flex-start",   // ← prevents stretching
  },
  disabledButton: { backgroundColor: '#6B6B6B', opacity: 0.5 },
  viewButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#5845D8', justifyContent: 'center',
    alignItems: 'center', shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 12, elevation: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5845D8',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusDeclined: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  statusTextActive: { color: '#059669' },
  statusTextPending: { color: '#D97706' },
  statusTextDeclined: { color: '#DC2626' },

  noTripsText: { fontSize: 16, color: '#6B6B6B', textAlign: 'center', marginTop: 20 },
});
