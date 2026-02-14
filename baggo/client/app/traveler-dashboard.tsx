import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Plane, Calendar, Package, TrendingUp, ChevronLeft } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




export default function TravelerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [trips, setTrips] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState<any | null>(null);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [symbol, setSymbol] = useState("₦");
  const [country, setCountry] = useState(null);
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
        setSymbol(currencySymbols[savedCurrency] || "₦");
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
      setSymbol(currencySymbols[detectedCurrency] || '₦');
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
        const response = await fetch(`${backendomain.backendomain}/api/baggo/getUser`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        console.log('🔍 Full user profile response:', data); // 🪵 See what comes from backend

        if (data.user) {
          setApiUser(data.user);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));

          // ✅ Set wallet balance directly from user.balance
          if (typeof data.user.balance === 'number') {
            console.log('💰 Setting wallet balance from user.balance:', data.user.balance);
            setWalletBalance(data.user.balance);
          } else {
            console.warn('⚠️ No numeric balance found in user profile:', data.user.balance);
            setWalletBalance(0);
          }
        } else {
          console.warn('⚠️ No user returned in getUser response — using cached data');
          const cached = await AsyncStorage.getItem('user');
          if (cached) {
            const parsed = JSON.parse(cached);
            setApiUser(parsed);
            setWalletBalance(parsed.balance || 0);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching user profile:', err);
        const cached = await AsyncStorage.getItem('user');
        if (cached) {
          const parsed = JSON.parse(cached);
          setApiUser(parsed);
          setWalletBalance(parsed.balance || 0);
        }
      }
    };

    fetchUser();
  }, []);

  // ✅ Fetch wallet + trips
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wallet balance
        const walletResponse = await fetch(`${backendomain.backendomain}/api/baggo/getWalletBalance`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const walletData = await walletResponse.json();
        if (walletData.success && walletData.data?.balance !== undefined)
          setWalletBalance(walletData.data.balance);
        else setWalletBalance(0);

        // Trips
        const tripsResponse = await fetch(`${backendomain.backendomain}/api/baggo/MyTrips`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const tripsData = await tripsResponse.json();
        if (tripsData.message === 'Trips retrieved successfully' && Array.isArray(tripsData.trips)) {
          const mapped = tripsData.trips
            .map(trip => ({
              _id: trip.id,
              from: trip.fromLocation,
              to: trip.toLocation,
              date: trip.departureDate,
              capacity: trip.availableKg,
              used: 0,
              requests: trip.request,
              earnings: trip.availableKg * trip.pricePerKg,
              status: trip.status || 'active',
            }))
            .filter(t => t._id);
          setTrips(mapped);
        } else setTrips([]);
      } catch (err) {
        console.error('Error fetching trips/wallet:', err);
        setTrips([]);
        setWalletBalance(0);
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
        const res = await fetch(`${backendomain.backendomain}/api/baggo/completed/${apiUser._id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Wallet Card */}
      <View style={styles.statsCard}>
        <LinearGradient colors={[Colors.gold, Colors.secondary]} style={styles.statGradient}>
          <TrendingUp size={32} color={Colors.white} />
          <Text style={styles.statValue}>
  {symbol}
  {walletBalance
    ? walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00"}
</Text>

          <Text style={styles.statLabel}>Wallet Balance</Text>
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
                      <Plane size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.tripInfo}>
                      <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                      <View style={styles.tripDate}>
                        <Calendar size={14} color={Colors.textLight} />
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
                      <Package size={16} color={Colors.textLight} />
                      <Text style={styles.tripStatText}>
                        {trip.used}/{trip.capacity} kg used
                      </Text>
                    </View>
                    <View style={styles.tripStat}>
                      <Text style={styles.requestBadge}>{trip.requests} requests</Text>
                    </View>
                  </View>

                  <View style={[styles.tripFooter, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>

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
            style={[styles.viewButton, { alignSelf: "flex-end" }, !trip._id && styles.disabledButton]}
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
                    <Package size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                    <View style={styles.tripDate}>
                      <Calendar size={14} color={Colors.textLight} />
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
        <Plus size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  statsCard: {
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statGradient: { padding: 24, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: Colors.white, marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 14, color: Colors.white, opacity: 0.95 },
  statsGrid: { flexDirection: 'row', backgroundColor: Colors.white },
  miniStat: { flex: 1, padding: 16, alignItems: 'center' },
  miniStatValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  miniStatLabel: { fontSize: 12, color: Colors.textLight },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textLight },
  tabTextActive: { color: Colors.white },
  content: { flex: 1, paddingHorizontal: 20 },
  tripCard: {
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
  tripHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tripIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.backgroundLight, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  tripInfo: { flex: 1 },
  tripRoute: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  tripDate: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripDateText: { fontSize: 13, color: Colors.textLight },
  tripStats: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tripStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripStatText: { fontSize: 13, color: Colors.textLight },
  requestBadge: {
    fontSize: 12, fontWeight: '600', color: Colors.primary,
    backgroundColor: Colors.backgroundLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsText: { fontSize: 14, color: Colors.textLight },
  earningsValue: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",   // ← prevents stretching
  },
  disabledButton: { backgroundColor: Colors.textLight, opacity: 0.5 },
  viewButtonText: { fontSize: 13, fontWeight: '600', color: Colors.white, },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center',
    alignItems: 'center', shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 12, elevation: 8,
  },
  editButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: Colors.primary,
  marginLeft: 10,
},
editButtonText: {
  color: Colors.white,
  fontWeight: "600",
},

  centerContent: { justifyContent: 'center', alignItems: 'center' },
  noTripsText: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 20 },
});
