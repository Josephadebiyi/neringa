import { View, Text, ScrollView, StyleSheet, Pressable, FlatList, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Truck, ChevronRight, Clock, MapPin, Search, FileText, Download, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface BagoActivity {
  id: string;
  type: 'Package' | 'Trip';
  from: string;
  to: string;
  status: string;
  date: string;
  tracking?: string;
  bookings?: number;
}

const MOCK_SHIPMENTS: BagoActivity[] = [];
const MOCK_TRIPS: BagoActivity[] = [];

export default function ShipmentsScreen() {
  const { currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const data = currentRole === 'sender' ? MOCK_SHIPMENTS : MOCK_TRIPS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{currentRole === 'sender' ? 'My Shipments' : 'My Trips'}</Text>
        <View style={styles.tabSwitcher}>
          <Pressable 
            onPress={() => setActiveTab('active')}
            style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('history')}
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={activeTab === 'active' ? data : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.card} 
            onPress={() => item.type === 'Package' ? router.push(`/shipment-details/${item.id}`) : router.push(`/(tabs)/trips`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.typeBadge}>
                {item.type === 'Package' ? <Package size={14} color={COLORS.primary} /> : <Truck size={14} color={COLORS.primary} />}
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            
            <View style={styles.routeRow}>
              <View style={styles.routeCol}>
                <Text style={styles.cityText}>{item.from}</Text>
                <Text style={styles.countryLabel}>Departure</Text>
              </View>
              <View style={styles.routeVisual}>
                <View style={styles.line} />
                <MapPin size={16} color={COLORS.accentLime} />
              </View>
              <View style={styles.routeCol}>
                <Text style={styles.cityText}>{item.to}</Text>
                <Text style={styles.countryLabel}>Arrival</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.statusBox}>
                <View style={[styles.statusDot, { backgroundColor: item.status === 'In Transit' ? COLORS.primary : COLORS.accentLemon }]} />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
              {item.tracking && (
                <Pressable 
                  style={styles.proofBtn} 
                  onPress={() => Alert.alert('Processing', 'Your shipment proof is being generated for customs declaration.')}
                >
                  <Download size={14} color={COLORS.primary} />
                  <Text style={styles.proofText}>Proof</Text>
                </Pressable>
              )}
              <ChevronRight size={18} color={COLORS.gray300} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Package size={60} color={COLORS.gray300} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Your {currentRole === 'sender' ? 'shipments' : 'trips'} will appear here once you start using Bago.
            </Text>
            <Pressable 
              style={styles.emptyCta} 
              onPress={() => {
                try {
                  router.push(currentRole === 'sender' ? '/create-shipment' : '/post-trip');
                } catch (err) {
                  console.error('Navigation error:', err);
                  Alert.alert('Navigation Error', 'Could not open the shipment form. Please try again.');
                }
              }}
            >
              <Text style={styles.emptyCtaText}>Start {currentRole === 'sender' ? 'Shipping' : 'Traveling'}</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgOff },
  header: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  tabSwitcher: { flexDirection: 'row', paddingHorizontal: 24 },
  tabButton: { marginRight: 24, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: '700', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary },
  list: { padding: 24, paddingBottom: 24 },
  card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  dateText: { fontSize: 13, color: COLORS.gray400, fontWeight: '600' },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  routeCol: { flex: 1 },
  cityText: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  countryLabel: { fontSize: 12, color: COLORS.gray400, fontWeight: '600', marginTop: 2 },
  routeVisual: { alignItems: 'center', width: 40 },
  line: { width: 20, height: 2, backgroundColor: COLORS.gray100, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 16 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  trackingPill: { backgroundColor: COLORS.bgSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  trackingText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  proofBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.bgSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary + '20' },
  proofText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyCta: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  emptyCtaText: { color: COLORS.white, fontSize: 16, fontWeight: '700' }
});
