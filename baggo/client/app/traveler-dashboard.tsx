import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Plus, Plane, Calendar, Package, TrendingUp } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TravelerDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [trips, setTrips] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState<any | null>(null);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [symbol, setSymbol] = useState("₦");
    const [country, setCountry] = useState(null);
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
      // Load saved currency and country from AsyncStorage
      const savedCurrency = await loadCurrency();
      const savedCountry = await AsyncStorage.getItem('userCountry');

      // Fetch current IP location
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      console.log("🌍 Location data:", data);

      const detectedCurrency = data.currency || "USD";
      const detectedCountry = data.country_name || "Unknown";

      // Check if country has changed
      if (savedCountry !== detectedCountry) {
        // Country changed → override currency and country
        setCurrency(detectedCurrency);
        setCountry(detectedCountry);
        setSymbol(currencySymbols[detectedCurrency] || "$");

        // Save new values
        await saveCurrency(detectedCurrency);
        await AsyncStorage.setItem('userCountry', detectedCountry);
      } else {
        // Country same → use saved values if any
        if (savedCurrency) setCurrency(savedCurrency);
        if (savedCountry) setCountry(savedCountry);
        setSymbol(currencySymbols[savedCurrency || detectedCurrency] || "$");
      }
    } catch (error) {
      console.error("Failed to detect location or load currency:", error);
      // Fallback defaults
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
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
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

                  <View style={styles.tripFooter}>
                    <Text style={styles.earningsText}>

                    </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: Colors.white },
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
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
  },
  disabledButton: { backgroundColor: Colors.textLight, opacity: 0.5 },
  viewButtonText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center',
    alignItems: 'center', shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 12, elevation: 8,
  },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  noTripsText: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 20 },
});
