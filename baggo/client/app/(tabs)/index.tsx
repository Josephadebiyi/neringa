import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Send, Package, Plane, Calendar, Weight, Star, Bell, User, Search, TrendingUp, Award, Truck, Wallet } from 'lucide-react-native';
import { currencies } from '@/utils/locations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendomain } from '@/utils/backendDomain';
import * as Location from 'expo-location';
import api from '@/utils/api';
import PushNotificationSetup from '@/utils/PushNotificationSetup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = `${backendomain.backendomain}/api/bago`;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'send' | 'earn'>('send');
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [location, setLocation] = useState('Unknown Location');
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [symbol, setSymbol] = useState("₦");
  const [country, setCountry] = useState<string | null>(null);
  const [isNigeria, setIsNigeria] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const base = (typeof backendomain === 'object' && backendomain.backendomain) ? backendomain.backendomain : backendomain;
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);



  const currencySymbols = {

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

    USD: "$",
    CAD: "CA$",
    MXN: "$",
    BRL: "R$",
    ARS: "$",
    CLP: "$",
    COP: "$",
    PEN: "S/",
    UYU: "$U",


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


    GBP: "£",
  };



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


  useEffect(() => {
    (async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        // Get current position
        const loc = await Location.getCurrentPositionAsync({});

        // Reverse geocode to get country info
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse.length > 0) {
          const countryCode = reverse[0].isoCountryCode || 'US';
          const countryName = reverse[0].country || 'Unknown';

          // Map country code to currency
          let currency = 'USD'; // default
          switch (countryCode) {
            case 'NG': currency = 'NGN'; break;
            case 'GH': currency = 'GHS'; break;
            case 'KE': currency = 'KES'; break;
            case 'ZA': currency = 'ZAR'; break;
            case 'EG': currency = 'EGP'; break;
            case 'TZ': currency = 'TZS'; break;
            case 'UG': currency = 'UGX'; break;
            case 'MA': currency = 'MAD'; break;
            case 'DZ': currency = 'DZD'; break;
            case 'SD': currency = 'SDG'; break;
            case 'FR': case 'DE': case 'IT': case 'ES': case 'PT': case 'NL':
            case 'LU': case 'BE': case 'IE': case 'GR': case 'FI': case 'EE':
            case 'LT': case 'LV': case 'CY': case 'MT': case 'SK': case 'SI':
              currency = 'EUR'; break;
            case 'GB': currency = 'GBP'; break;
            case 'CA': currency = 'CAD'; break;
            case 'MX': currency = 'MXN'; break;
            case 'BR': currency = 'BRL'; break;
            case 'AR': currency = 'ARS'; break;
            case 'CL': currency = 'CLP'; break;
            case 'CO': currency = 'COP'; break;
            case 'PE': currency = 'PEN'; break;
            case 'UY': currency = 'UYU'; break;
            case 'IN': currency = 'INR'; break;
            case 'CN': currency = 'CNY'; break;
            case 'JP': currency = 'JPY'; break;
            case 'RU': currency = 'RUB'; break;
            case 'TR': currency = 'TRY'; break;
            case 'AE': currency = 'AED'; break;
            case 'SG': currency = 'SGD'; break;
            case 'AU': currency = 'AUD'; break;
            case 'NZ': currency = 'NZD'; break;
            case 'CH': currency = 'CHF'; break;
            default: currency = 'USD';
          }

          // Update state
          setCountry(countryCode);
          setCurrency(currency);
          setSymbol(currencySymbols[currency as keyof typeof currencySymbols] || '$');
          setIsNigeria(countryCode === 'NG');

          console.log('Detected Country:', countryName);
          console.log('Country Code:', countryCode);
          console.log('Currency:', currency, currencySymbols[currency as keyof typeof currencySymbols]);
        }
      } catch (err) {
        console.error('Location detection error:', err);
      }
    })();
  }, []);


  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/bago/getNotifications');
      const notifs = response.data.data.notifications;
      setNotifications(notifs);

      // Check if any notification is unread
      const unread = notifs.some((notif: any) => !notif.isRead);
      setHasUnread(unread);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching profile data...");
        const response = await api.get('/api/bago/Profile');
        const profileData = response.data;
        console.log('profileData:', profileData);

        if (profileData?.data?.findUser) {
          const user = profileData.data.findUser;
          setUserData(user);
          const pBalance = Number(user.balance ?? 0);
          setBalance(!Number.isNaN(pBalance) ? pBalance : 0);
        } else {
          console.warn('Profile returned no user:', profileData);
          setUserData(null);
          setBalance(0);
        }
      } catch (err) {
        console.error("🚨 Network or unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  useEffect(() => {
    loadMode();
    fetchData();
    fetchUserLocation();
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchRecentOrders();  // refresh orders whenever screen focuses
    }, [])
  );


  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('homepage_mode');
      if (savedMode) {
        setMode(savedMode as 'send' | 'earn');
      }
    } catch (error) {
      console.error('Error loading mode:', error);
    }
  };

  const handleModeChange = async (newMode: 'send' | 'earn') => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem('homepage_mode', newMode);
    } catch (error) {
      console.error('Error saving mode:', error);
    }
  };

  const handleSearch = () => {
    if (mode === 'send') {
      router.push('/send-package');
    } else {
      router.push('/traveler-dashboard');
    }
  };

  const fetchUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        setLocation('Unknown Location');
        setLoadingLocation(false);
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationData.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode.length > 0) {
        const { city, country } = reverseGeocode[0];
        const locationString = city && country ? `${city}, ${country}` : 'Unknown Location';
        setLocation(locationString);
      } else {
        setLocation('Unknown Location');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocation('Unknown Location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchRecentOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await api.get('/api/bago/recentOrder');
      if (response.data.success && Array.isArray(response.data.data)) {
        const sortedOrders = response.data.data.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentOrders(sortedOrders.slice(0, 10));
      } else {
        setRecentOrders([]);
      }
    } catch (error: any) {
      setRecentOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchData = async () => {
    try {
      const walletResponse = await api.get('/api/bago/getWallet');
      const walletData = walletResponse.data;
      if (walletData.success && walletData.data?.balance !== undefined) {
        setBalance(walletData.data.balance);
      } else {
        setBalance(0);
      }
      setLoadingBalance(false);

      const response = await api.get('/api/bago/getTravelers');
      const data = response.data;

      if (data.success && Array.isArray(data.data.gettravelers)) {
        const tripsWithProfiles = data.data.gettravelers.map((trip: any) => {
          const user = Array.isArray(data.data.findUsers)
            ? data.data.findUsers.find((u: any) => u._id === trip.user)
            : null;

          const profile = user
            ? {
              id: user._id,
              first_name: user.firstName,
              last_name: user.lastName,
              average_rating: user.averageRating || 0,
              total_trips: user.totalTrips || 0,
              verified: user.kycStatus === 'approved',
              email: user.email,
            }
            : {
              id: trip.user,
              first_name: 'Traveler',
              average_rating: 0,
              total_trips: 0,
            };

          return {
            id: trip._id,
            traveler_id: trip.user,
            from_location: trip.fromLocation,
            to_location: trip.toLocation,
            departure_date: trip.departureDate,
            remaining_kg: trip.availableKg,
            price_per_kg: trip.pricePerKg,
            travelMeans: trip.travelMeans,
            profile,
          };
        });
        setTrips(tripsWithProfiles.slice(0, 20));
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTrips([]);
      setBalance(0);
    } finally {
      setLoadingTrips(false);
      setLoadingBalance(false);
    }
  };

  return (
    <>
      <PushNotificationSetup />
      <View style={styles.container}>
        <LinearGradient
          colors={['#5845D8', '#4534B8']}
          style={styles.header}
        >
          <View style={styles.topBar}>
            <View style={styles.locationBadge}>
              <MapPin size={14} color={'#FFFFFF'} />
              {loadingLocation ? (
                <ActivityIndicator size="small" color={'#FFFFFF'} />
              ) : (
                <Text style={styles.locationText}>{location}</Text>
              )}
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
              >
                <Bell size={20} color={'#FFFFFF'} />
                {hasUnread && <View style={styles.notificationDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push('/profile')}
              >
                <User size={20} color={'#FFFFFF'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modeSwitcherTop}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'send' && styles.modeTabActive]}
              onPress={() => handleModeChange('send')}
            >
              <Send size={16} color={mode === 'send' ? '#5845D8' : '#FFFFFF'} />
              <Text style={[styles.modeTabText, mode === 'send' && { color: '#5845D8' }]}>
                Send Package
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'earn' && styles.modeTabActive]}
              onPress={() => handleModeChange('earn')}
            >
              <TrendingUp size={16} color={mode === 'earn' ? '#5845D8' : '#FFFFFF'} />
              <Text style={[styles.modeTabText, mode === 'earn' && { color: '#5845D8' }]}>
                Earn Money
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              {mode === 'send' ? 'Send your package!' : 'Earn while traveling!'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {mode === 'send'
                ? 'Find trusted travelers to deliver packages'
                : 'Turn unused luggage space into earnings'}
            </Text>

            <View style={styles.searchContainer}>
              <Search size={20} color={'#6B6B6B'} />
              <TextInput
                style={styles.searchInput}
                placeholder={mode === 'send' ? 'Where to send?' : 'Where are you traveling?'}
                placeholderTextColor={'#9E9E9E'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>
                {mode === 'send' ? 'Find Travelers' : 'Start Earning'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.promosSection}>
            <Text style={styles.promosTitle}>Special Offers</Text>

            <LinearGradient colors={['#D4A574', '#C9934A']} style={styles.promoBanner}>
              <View style={styles.promoContent}>
                <Text style={styles.promoBigTitle}>Get 3% Off!</Text>

                <Text style={styles.promoDesc}>
                  Use a referral code and enjoy 3% off{'\n'}your first delivery
                </Text>

                <View style={styles.promoCodeBox}>
                  <Text style={styles.promoCode}>REFERRAL</Text>
                </View>
              </View>

              <View>
                <Text style={styles.promoEmoji}>🎁</Text>
              </View>
            </LinearGradient>

          </View>

          {mode === 'send' ? (
            <>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push('/send-package')}
                >
                  <View style={styles.quickActionIcon}>
                    <Send size={24} color={'#5845D8'} />
                  </View>
                  <Text style={styles.quickActionText}>Send Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push('/tracking')}
                >
                  <View style={styles.quickActionIcon}>
                    <Package size={24} color={'#5845D8'} />
                  </View>
                  <Text style={styles.quickActionText}>Track</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push('/my-shipments')}
                >
                  <View style={styles.quickActionIcon}>
                    <Truck size={24} color={'#5845D8'} />
                  </View>
                  <Text style={styles.quickActionText}>Shipments</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {loadingOrders ? (
                  <ActivityIndicator
                    size="large"
                    color={'#5845D8'}
                    style={styles.spinner}
                  />
                ) : recentOrders.length === 0 ? (
                  <Text style={styles.noOrdersText}>No recent orders found</Text>
                ) : (
                  recentOrders.map((order) => (
                    <TouchableOpacity
                      key={order.requestId}
                      style={styles.orderCard}
                      onPress={() => {

                        router.push({
                          pathname: '/package-details',
                          params: { requestId: order.requestId },
                        });
                      }}
                    >
                      <View style={styles.orderIcon}>
                        <Package size={24} color={'#5845D8'} />
                      </View>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderDescription} numberOfLines={1}>
                          {order.package?.description || 'No description'}
                        </Text>
                        <View style={styles.orderRoute}>
                          <MapPin size={16} color={'#6B6B6B'} />
                          <Text style={styles.orderRouteText}>
                            {order.package?.fromCity} → {order.package?.toCity}
                          </Text>
                        </View>
                        <Text style={styles.orderTraveler}>
                          Traveler: {order.traveler?.firstName && order.traveler?.lastName
                            ? `${order.traveler.firstName} ${order.traveler.lastName}`
                            : order.traveler?.firstName || 'Unknown'}
                        </Text>
                        <Text style={styles.orderInsurance}>
                          Insurance: {order.insurance ? `Yes (€${order.insuranceCost})` : 'No'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              order.status === 'pending'
                                ? '#FF9800'
                                : order.status === 'accepted'
                                  ? '#4CAF50'
                                  : order.status === 'rejected'
                                    ? '#F44336'
                                    : order.status === 'completed'
                                      ? '#81C784'
                                      : '#5845D8',
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Travelers</Text>
                <Text style={styles.sectionSubtitle}>Find someone traveling your route</Text>

                {loadingTrips ? (
                  <ActivityIndicator
                    size="large"
                    color={'#5845D8'}
                    style={styles.spinner}
                  />
                ) : trips.length === 0 ? (
                  <Text style={styles.noTripsText}>No travelers available yet</Text>
                ) : (
                  trips.map((trip) => (
                    <TouchableOpacity
                      key={trip.id}
                      style={styles.tripCard}
                      onPress={() =>
                        router.push({
                          pathname: `/traveler-details/${trip.id}` as any,
                          params: {
                            tripId: trip.id,
                            name: trip.profile?.first_name || 'Traveler',
                            travelerId: trip.traveler_id,
                            rating: (trip.profile?.average_rating ?? 0).toString(),
                            trips: (trip.profile?.total_trips ?? 0).toString(),
                            verified: trip.profile?.verified ? 'true' : 'false',
                            from: trip.from_location || '',
                            to: trip.to_location || '',
                            date: trip.departure_date || new Date().toISOString(),
                            availableKg: (trip.remaining_kg ?? 0).toString(),
                            pricePerKg: (trip.price_per_kg ?? 0).toString(),
                            mode: trip.travelMeans || 'flight',
                            travellerEmail: trip.profile?.email || '',
                          },
                        })
                      }
                    >
                      <View style={styles.tripHeader}>
                        <View style={styles.travelerInfo}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {trip.profile?.first_name ? trip.profile.first_name.charAt(0).toUpperCase() : 'T'}
                            </Text>
                          </View>
                          <View style={styles.travelerDetails}>
                            <Text style={styles.travelerName}>
                              {trip.profile?.first_name && trip.profile?.last_name
                                ? `${trip.profile.first_name} ${trip.profile.last_name}`
                                : trip.profile?.first_name || 'Traveler'}
                            </Text>
                            <View style={styles.ratingRow}>
                              <Star size={12} color={'#F5C563'} fill={'#F5C563'} />
                              <Text style={styles.ratingText}>{(trip.profile?.average_rating ?? 0).toFixed(1)}</Text>
                              <Text style={styles.tripCount}>{`• ${trip.profile?.total_trips ?? 0} trips`}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.modeIcon}>
                          <Plane size={18} color={'#5845D8'} />
                        </View>
                      </View>

                      <View style={styles.tripRoute}>
                        <MapPin size={16} color={'#6B6B6B'} />
                        <Text style={styles.routeText} numberOfLines={1}>
                          {`${trip.from_location || 'Origin'} → ${trip.to_location || 'Destination'}`}
                        </Text>
                      </View>

                      <View style={styles.tripMeta}>
                        <View style={styles.metaItem}>
                          <Calendar size={14} color={'#6B6B6B'} />
                          <Text style={styles.metaText}>
                            {trip.departure_date ? new Date(trip.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Weight size={14} color={'#6B6B6B'} />
                          <Text style={styles.metaText}>{`${trip.remaining_kg ?? 0} kg available`}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => router.push('/wallet')}
                >
                  <LinearGradient
                    colors={['#F5C563', '#E8B86D']}
                    style={styles.statGradient}
                  >
                    {loadingBalance ? (
                      <ActivityIndicator size="small" color={'#FFFFFF'} />
                    ) : (
                      <>
                        <Text style={styles.statValue}>
                          {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>

                        <Text style={styles.statLabel}>Total Earned</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['#4CAF50', '#81C784']}
                    style={styles.statGradient}
                  >
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Packages Delivered</Text>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push('/add-trip')}
                >
                  <View style={styles.quickActionIcon}>
                    <Plane size={24} color={'#5845D8'} />
                  </View>
                  <Text style={styles.quickActionText}>Add Trip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push('/traveler-dashboard')}
                >
                  <View style={styles.quickActionIcon}>
                    <Package size={24} color={'#5845D8'} />
                  </View>
                  <Text style={styles.quickActionText}>My Trips</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push('/my-deliveries')}
                >
                  <View style={styles.quickActionIcon}>
                    <Truck size={24} color={'#5845D8'} />
                  </View>
                  <Text style={styles.quickActionText}>Deliveries</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Why Carry Packages?</Text>

                <View style={styles.benefitCard}>
                  <View style={styles.benefitIcon}>
                    <TrendingUp size={24} color={'#5845D8'} />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Extra Income</Text>
                    <Text style={styles.benefitDesc}>
                      Earn €15-50 per package on your existing trips
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitCard}>
                  <View style={styles.benefitIcon}>
                    <Award size={24} color={'#5845D8'} />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Build Trust</Text>
                    <Text style={styles.benefitDesc}>
                      Get verified and earn ratings from satisfied senders
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 24,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchButton: {
    backgroundColor: '#F5C563',
    borderRadius: 12,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  modeSwitcherTop: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF9F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF9F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  orderRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  orderRouteText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  orderTraveler: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  orderInsurance: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5845D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  travelerDetails: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  tripCount: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  modeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF9F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  priceText: {
    marginLeft: 'auto',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5845D8',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  benefitCard: {
    flexDirection: 'row',
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
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF9F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  promosSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  promosTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  promoBanner: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 90,
  },
  promoContent: {
    flex: 1,
  },
  promoBigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 8,
    lineHeight: 14,
  },
  promoCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  promoEmoji: {
    fontSize: 28,
    marginLeft: 8,
  },
  spinner: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  noTripsText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginVertical: 20,
  },
  noOrdersText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginVertical: 20,
  },
});
