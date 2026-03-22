import { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, ArrowLeft, Filter, 
  Clock, MapPin, Briefcase, ChevronRight,
  TrendingUp, Star, ShieldCheck, Map, Globe
} from 'lucide-react-native';
import tripService, { Trip } from '../lib/trips';
import currencyService from '../lib/currency';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

// Helper for flag from ISO code
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Map of country names to ISO codes (partial, will add more as needed or use a better search)
const COUNTRY_MAP: Record<string, string> = {
  'United Kingdom': 'gb', 'UK': 'gb', 'GB': 'gb',
  'Nigeria': 'ng', 'NG': 'ng',
  'United States': 'us', 'USA': 'us', 'US': 'us',
  'Canada': 'ca', 'CA': 'ca',
  'France': 'fr', 'FR': 'fr',
  'Germany': 'de', 'DE': 'de',
  'Spain': 'es', 'ES': 'es',
  'Ghana': 'gh', 'GH': 'gh',
  'South Africa': 'za', 'ZA': 'za',
  'United Arab Emirates': 'ae', 'UAE': 'ae'
};

const getFlagFromName = (name: string) => {
  const code = COUNTRY_MAP[name] || name?.substring(0, 2).toLowerCase(); // Fallback
  return getFlagEmoji(code);
};

export default function TripsListScreen() {
  const { from, to, date } = useLocalSearchParams();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [futureTrips, setFutureTrips] = useState<Trip[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});

  const targetCurrency = user?.preferredCurrency || 'USD';

  useEffect(() => {
    const fetchRates = async () => {
      const r = await currencyService.getRates();
      setRates(r);
    };
    fetchRates();
    loadTrips();
  }, [from, to, date]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const fromParts = (from as string)?.split(', ') || [];
      const toParts = (to as string)?.split(', ') || [];
      
      const searchDate = date ? new Date().getFullYear() + '-' + date.toString().replace(' ', '-') : undefined;

      const result = await tripService.searchTrips({
        fromLocation: fromParts[0],
        toLocation: toParts[0],
        departureDate: searchDate
      });
      setTrips(result.trips || []);

      const futureResult = await tripService.searchTrips({
        fromLocation: fromParts[0],
        toLocation: toParts[0],
      });
      
      const exactIds = new Set((result.trips || []).map(t => t.id || (t as any)._id));
      const filteredFuture = (futureResult.trips || []).filter(ft => !exactIds.has(ft.id || (ft as any)._id));
      setFutureTrips(filteredFuture);
      
    } catch (e) {
      console.error('Search trips error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  // Function to convert price
  const convertPrice = (price: number, sourceCurrency: string = 'USD') => {
    if (sourceCurrency === targetCurrency) return currencyService.format(price, sourceCurrency);
    
    if (rates[sourceCurrency] && rates[targetCurrency]) {
      const converted = (price / rates[sourceCurrency]) * rates[targetCurrency];
      return currencyService.format(converted, targetCurrency);
    }
    return currencyService.format(price, sourceCurrency); // Fallback
  };

  const renderTrip = ({ item }: { item: any }) => (
    <Pressable 
      key={item.id || item._id}
      style={styles.tripCard}
      onPress={() => router.push({ pathname: '/request-shipment/[id]', params: { id: item.id || item._id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.carrierInfo}>
          <View style={[styles.carrierAvatar, { backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' }]}>
             {item.user?.avatar ? <Image source={{ uri: item.user.avatar }} style={styles.avatarImg} /> : <Star size={20} color={COLORS.primary} />}
          </View>
          <View>
            <Text style={styles.carrierName}>{item.user?.firstName || 'Traveler'}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color={COLORS.accentLemon} fill={COLORS.accentLemon} />
              <Text style={styles.ratingText}>4.9 (24 reviews)</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{convertPrice(item.pricePerKg || 20, item.currency || 'USD')}/kg</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.timeColumn}>
          <Globe size={18} color={COLORS.gray400} />
          <View style={styles.timeLine} />
          <MapPin size={18} color={COLORS.primary} />
        </View>
        <View style={styles.cityColumn}>
          <View style={styles.cityRow}>
             <Text style={styles.cityFlag}>{getFlagFromName(item.fromCountry)}</Text>
             <Text style={styles.cityText} numberOfLines={1}>{item.fromCity}, {item.fromCountry}</Text>
          </View>
          <View style={{ height: 16 }} />
          <View style={styles.cityRow}>
             <Text style={styles.cityFlag}>{getFlagFromName(item.toCountry)}</Text>
             <Text style={styles.cityText} numberOfLines={1}>{item.toCity}, {item.toCountry}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.metaBadge}>
           <Briefcase size={14} color={COLORS.gray400} />
           <Text style={styles.metaLabel}>{item.availableWeight}kg available</Text>
         </View>
         <View style={styles.metaBadge}>
            <Clock size={14} color={COLORS.gray400} />
            <Text style={styles.metaLabel}>{new Date(item.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
         </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerRoute} numberOfLines={1}>
            {from ? from.toString().split(',')[0] : 'Anywhere'} → {to ? to.toString().split(',')[0] : 'Global'}
          </Text>
          <Text style={styles.headerDate}>{date || 'Any Date'} • 1 package</Text>
        </View>
        <View style={styles.currencyBadge}>
           <Text style={styles.currencyBadgeText}>{targetCurrency}</Text>
        </View>
      </View>

      <View style={styles.flex}>
        {loading ? (
          <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.gray500, fontWeight: '600' }}>Searching for travelers...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
            {trips.length > 0 && (
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{trips.length} Ready to Ship</Text>
                <Text style={styles.listSubtitle}>Matched with your exact requirements.</Text>
              </View>
            )}

            {trips.map(trip => renderTrip({ item: trip }))}

            {futureTrips.length > 0 && (
              <>
                <View style={[styles.listHeader, { marginTop: 32 }]}>
                  <Text style={styles.listTitle}>Suggested Future Trips</Text>
                  <Text style={styles.listSubtitle}>Travelers heading your way on close dates.</Text>
                </View>
                {futureTrips.map(trip => renderTrip({ item: trip }))}
              </>
            )}

            {trips.length === 0 && futureTrips.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
                <Map size={64} color={COLORS.gray200} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginTop: 24, textAlign: 'center' }}>No matched trips yet</Text>
                <Text style={{ fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  We couldn't find any travelers for this specific route right now. Try adjusting your dates or check back later!
                </Text>
                <TouchableOpacity 
                  style={styles.retryBtn}
                  onPress={() => router.replace('/(tabs)')}
                >
                  <Text style={styles.retryBtnText}>Modify Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgOff },
  flex: { flex: 1 },
  header: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1, marginLeft: 12 },
  headerRoute: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  currencyBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currencyBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '900' },
  
  listPadding: { padding: 20, paddingBottom: 20 },
  listHeader: { marginBottom: 20, paddingHorizontal: 4 },
  listTitle: { fontSize: 22, fontWeight: '900', color: COLORS.black },
  listSubtitle: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', marginTop: 4 },
  
  tripCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 28, 
    padding: 24, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  carrierInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  carrierAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  carrierName: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.gray600 },
  priceContainer: { backgroundColor: COLORS.primaryLighter, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, justifyContent: 'center' },
  priceText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  
  routeContainer: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  timeColumn: { alignItems: 'center', width: 20 },
  timeLine: { width: 2, height: 28, backgroundColor: COLORS.bgSoft, marginVertical: 4 },
  cityColumn: { flex: 1 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cityFlag: { fontSize: 18 },
  cityText: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  
  cardFooter: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 16 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.bgSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  metaLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray600 },

  retryBtn: { 
    marginTop: 32, 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  retryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
