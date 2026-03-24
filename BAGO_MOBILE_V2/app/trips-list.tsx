import { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Modal, FlatList } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Clock, MapPin, Briefcase,
  Star, Map, Globe, Search, X, Pencil
} from 'lucide-react-native';
import tripService, { Trip } from '../lib/trips';
import currencyService from '../lib/currency';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import axios from 'axios';

// Helper for flag from ISO code
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

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
  if (!name) return '🌍';
  const nameKey = name.trim();
  const code = COUNTRY_MAP[nameKey] || COUNTRY_MAP[nameKey.toUpperCase()] || nameKey.substring(0, 2).toLowerCase();
  return getFlagEmoji(code);
};

export default function TripsListScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [currentFrom, setCurrentFrom] = useState((params.from as string) || '');
  const [currentTo, setCurrentTo] = useState((params.to as string) || '');
  const [currentDate, setCurrentDate] = useState((params.date as string) || '');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [futureTrips, setFutureTrips] = useState<Trip[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});

  // Modify search modal state
  const [showModify, setShowModify] = useState(false);
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [editDate, setEditDate] = useState('');
  const [pickingField, setPickingField] = useState<'from' | 'to' | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationTimer = useRef<any>(null);

  const targetCurrency = user?.preferredCurrency || 'USD';

  useEffect(() => {
    const fetchRates = async () => {
      const r = await currencyService.getRates();
      setRates(r);
    };
    fetchRates();
    loadTrips(currentFrom, currentTo, currentDate);
  }, []);

  const loadTrips = async (from: string, to: string, date: string) => {
    setLoading(true);
    try {
      const fromParts = from?.split(', ') || [];
      const toParts = to?.split(', ') || [];
      const searchDate = date ? new Date().getFullYear() + '-' + date.replace(/ /g, '-') : undefined;

      const result = await tripService.searchTrips({
        fromLocation: fromParts[0],
        toLocation: toParts[0],
        departureDate: searchDate,
      });
      setTrips(result.trips || []);

      const futureResult = await tripService.searchTrips({
        fromLocation: fromParts[0],
        toLocation: toParts[0],
      });

      const exactIds = new Set((result.trips || []).map((t: any) => t.id || t._id));
      setFutureTrips((futureResult.trips || []).filter((ft: any) => !exactIds.has(ft.id || ft._id)));
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

  const convertPrice = (price: number, sourceCurrency: string = 'USD') => {
    if (sourceCurrency === targetCurrency) return currencyService.format(price, sourceCurrency);
    if (rates[sourceCurrency] && rates[targetCurrency]) {
      return currencyService.format((price / rates[sourceCurrency]) * rates[targetCurrency], targetCurrency);
    }
    return currencyService.format(price, sourceCurrency);
  };

  // --- Modify Search ---
  const openModify = () => {
    setEditFrom(currentFrom);
    setEditTo(currentTo);
    setEditDate(currentDate);
    setPickingField(null);
    setLocationQuery('');
    setLocationResults([]);
    setShowModify(true);
  };

  const fetchLocations = async (q: string) => {
    if (!q || q.length < 2) { setLocationResults([]); return; }
    setLocationLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8`);
      setLocationResults(res.data.map((item: any) => ({
        name: `${item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0]}, ${item.address.country}`,
      })));
    } catch {
      setLocationResults([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const onLocationQueryChange = (q: string) => {
    setLocationQuery(q);
    if (locationTimer.current) clearTimeout(locationTimer.current);
    locationTimer.current = setTimeout(() => fetchLocations(q), 400);
  };

  const selectLocation = (name: string) => {
    if (pickingField === 'from') setEditFrom(name);
    else if (pickingField === 'to') setEditTo(name);
    setPickingField(null);
    setLocationQuery('');
    setLocationResults([]);
  };

  const applySearch = () => {
    setCurrentFrom(editFrom);
    setCurrentTo(editTo);
    setCurrentDate(editDate);
    setShowModify(false);
    loadTrips(editFrom, editTo, editDate);
  };

  // --- Trip card ---
  const renderTrip = (item: any) => (
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
            <Text style={styles.cityText} numberOfLines={1}>{item.fromLocation}, {item.fromCountry}</Text>
          </View>
          <View style={{ height: 16 }} />
          <View style={styles.cityRow}>
            <Text style={styles.cityFlag}>{getFlagFromName(item.toCountry)}</Text>
            <Text style={styles.cityText} numberOfLines={1}>{item.toLocation}, {item.toCountry}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaBadge}>
          <Briefcase size={14} color={COLORS.gray400} />
          <Text style={styles.metaLabel}>{item.availableKg}kg available</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerContent} onPress={openModify}>
          <Text style={styles.headerRoute} numberOfLines={1}>
            {currentFrom ? currentFrom.split(',')[0] : 'Anywhere'} → {currentTo ? currentTo.split(',')[0] : 'Global'}
          </Text>
          <Text style={styles.headerDate}>{currentDate || 'Any Date'} • 1 package</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openModify} style={styles.editBtn}>
          <Pencil size={16} color={COLORS.white} />
        </TouchableOpacity>
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

            {trips.map(trip => renderTrip(trip))}

            {futureTrips.length > 0 && (
              <>
                <View style={[styles.listHeader, { marginTop: 32 }]}>
                  <Text style={styles.listTitle}>Suggested Future Trips</Text>
                  <Text style={styles.listSubtitle}>Travelers heading your way on close dates.</Text>
                </View>
                {futureTrips.map(trip => renderTrip(trip))}
              </>
            )}

            {trips.length === 0 && futureTrips.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
                <Map size={64} color={COLORS.gray200} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginTop: 24, textAlign: 'center' }}>No matched trips yet</Text>
                <Text style={{ fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  We couldn't find any travelers for this specific route right now. Try adjusting your dates or check back later!
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={openModify}>
                  <Text style={styles.retryBtnText}>Modify Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Modify Search Modal */}
      <Modal visible={showModify} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modify Search</Text>
              <TouchableOpacity onPress={() => setShowModify(false)}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {/* From */}
            <Text style={styles.fieldLabel}>From</Text>
            <TouchableOpacity
              style={styles.fieldInput}
              onPress={() => { setPickingField('from'); setLocationQuery(editFrom); }}
            >
              <Globe size={18} color={COLORS.gray400} />
              <Text style={[styles.fieldText, !editFrom && { color: COLORS.gray400 }]} numberOfLines={1}>
                {editFrom || 'Leaving from...'}
              </Text>
            </TouchableOpacity>

            {/* To */}
            <Text style={styles.fieldLabel}>To</Text>
            <TouchableOpacity
              style={styles.fieldInput}
              onPress={() => { setPickingField('to'); setLocationQuery(editTo); }}
            >
              <MapPin size={18} color={COLORS.primary} />
              <Text style={[styles.fieldText, !editTo && { color: COLORS.gray400 }]} numberOfLines={1}>
                {editTo || 'Going to...'}
              </Text>
            </TouchableOpacity>

            {/* Date (simple text input) */}
            <Text style={styles.fieldLabel}>Date (optional)</Text>
            <View style={styles.fieldInput}>
              <Clock size={18} color={COLORS.gray400} />
              <TextInput
                style={styles.fieldText}
                placeholder="e.g. Jun 15, 2025"
                placeholderTextColor={COLORS.gray400}
                value={editDate}
                onChangeText={setEditDate}
              />
            </View>

            {/* Location picker sub-panel */}
            {pickingField && (
              <View style={styles.locationPanel}>
                <View style={styles.locationSearchRow}>
                  <Search size={18} color={COLORS.gray400} />
                  <TextInput
                    style={styles.locationSearchInput}
                    placeholder={`Search ${pickingField === 'from' ? 'origin' : 'destination'}...`}
                    placeholderTextColor={COLORS.gray400}
                    value={locationQuery}
                    onChangeText={onLocationQueryChange}
                    autoFocus
                  />
                  {locationLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
                </View>
                <FlatList
                  data={locationResults}
                  keyExtractor={(_, i) => String(i)}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.locationItem} onPress={() => selectLocation(item.name)}>
                      <MapPin size={16} color={COLORS.gray400} />
                      <Text style={styles.locationItemText} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    locationQuery.length >= 2 && !locationLoading ? (
                      <Text style={{ color: COLORS.gray400, padding: 12, fontWeight: '600' }}>No results found</Text>
                    ) : null
                  }
                />
              </View>
            )}

            <TouchableOpacity style={styles.applyBtn} onPress={applySearch}>
              <Search size={20} color={COLORS.white} />
              <Text style={styles.applyBtnText}>Search Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  listPadding: { padding: 20, paddingBottom: 40 },
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
    elevation: 3,
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
    shadowRadius: 8,
  },
  retryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgSoft, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 16 },
  fieldText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.black },
  locationPanel: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100, marginBottom: 16, overflow: 'hidden' },
  locationSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  locationSearchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.black },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  locationItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.black },
  applyBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  applyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
