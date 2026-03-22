import { View, ScrollView, Pressable, StyleSheet, TextInput, Image, Dimensions, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Search, Briefcase, 
  ShieldCheck, Zap, Navigation, MapPin, 
  Plus, Calendar as CalendarIcon, Package, Globe,
  ArrowRight, User, Plane, FileText,
  Truck, ArrowLeft, X, Wallet, Download, Bell,
  ArrowUpRight, ChevronLeft, ChevronRight,
  Shield, CreditCard, Camera, Heart, Gift,
  Clock, Minus, CheckCircle, Check, Info
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import api from '../../lib/api';
import { useNotifications } from '../../hooks/useNotifications';
import { useCurrency } from '../../hooks/useCurrency';

const { width } = Dimensions.get('window');

const MORE_SERVICES = [
  { id: '1', title: 'Gift Items', desc: 'Send gifts to loved ones globally.', icon: <Heart size={24} color={COLORS.primary} />, color: '#FFF1F1', route: '/services/gift-items' },
  { id: '2', title: 'Buy Items', desc: 'Ask a traveler to buy for you.', icon: <Package size={24} color={COLORS.primary} />, color: '#F1F5FF', route: '/services/buy-items' },
  { id: '3', title: 'Group Shipping', desc: 'Lower costs for bulky items.', icon: <Globe size={24} color={COLORS.primary} />, color: '#F1FFF1', route: '/services/group-shipping' }
];

const HIGH_DEMAND_ROUTES = [
  { 
    id: '1', 
    from: 'London', 
    to: 'Lagos', 
    image: 'https://images.unsplash.com/photo-1596753738918-6c8430e7046e?q=80&w=400&auto=format&fit=crop',
    tag: 'Popular'
  },
  { 
    id: '2', 
    from: 'Paris', 
    to: 'Toronto', 
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&auto=format&fit=crop',
    tag: 'Fast-Moving'
  }
];

// Helper for flag emoji from ISO code
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function HomeScreen() {
  const { user, currentRole, toggleRole, acceptTerms } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [pickingField, setPickingField] = useState<'from' | 'to'>('from');
  const [showAgreement, setShowAgreement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [wallet] = useState({ balance: 1240.50, pending: 0, currency: '$' });
  const [bannerConfig, setBannerConfig] = useState<any>(null);
  const { formatCurrency } = useCurrency();

  useNotifications();

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isCarrier = currentRole === 'carrier';

  const handleActionWithTerms = (action: () => void) => {
    if (!user?.acceptedTerms) setShowAgreement(true);
    else action();
  };

  const fetchGlobalLocations = async (query: string) => {
    if (!query || query.length < 2) return;
    setLoadingLocations(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=8`);
      const results = response.data.map((item: any) => ({
        name: `${item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0]}, ${item.address.country}`,
        country: item.address.country,
        country_code: item.address.country_code,
        type: 'city'
      }));
      setLocations(results);
    } catch (err) {
      console.error('Location fetch error:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGlobalLocations(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/get-settings');
      if (response.data.success && response.data.data.banner) {
        setBannerConfig(response.data.data.banner);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const renderCalendar = () => {
    const days = [];
    const dateClone = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDay = dateClone.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
        const isSelected = selectedDate.toDateString() === d.toDateString();
        const isToday = new Date().toDateString() === d.toDateString();
        
        days.push(
          <TouchableOpacity 
            key={i} 
            style={[styles.calendarDay, isSelected && styles.calendarDaySelected]} 
            onPress={() => { setSelectedDate(d); setDate(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })); setShowCalendar(false); }}
          >
             <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isToday && { color: COLORS.primary, fontWeight: '900' }]}>{i}</Text>
          </TouchableOpacity>
        );
    }
    return days;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient 
        colors={['rgba(88, 69, 216, 0.08)', 'rgba(88, 69, 216, 0.03)', 'transparent']} 
        style={StyleSheet.absoluteFill} 
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.25 }}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/bago-logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.headerCenter}>
          <TouchableOpacity style={[styles.headerModeBtn, !isCarrier && styles.headerModeBtnActive]} onPress={() => isCarrier && toggleRole()}>
             <Text style={[styles.headerModeLabel, !isCarrier && styles.headerModeLabelActive]}>Sender</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerModeBtn, isCarrier && styles.headerModeBtnActive]} onPress={() => !isCarrier && toggleRole()}>
             <Text style={[styles.headerModeLabel, isCarrier && styles.headerModeLabelActive]}>Traveler</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.profileBox} onPress={() => router.push('/(tabs)/profile')}>
             {user?.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatar} /> : <User size={20} color={COLORS.black} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.welcomeMsg}>Welcome to Bago</Text>
          <Text style={styles.heroTitle}>
            {isCarrier ? 'Make more on\nyour next trip' : `Hello ${user?.firstName || 'User'}, what are you sending today?`}
          </Text>
          
          {!isCarrier ? (
            <View style={styles.searchCard}>
              <View style={styles.inputStack}>
                <Pressable style={styles.inputItem} onPress={() => { setPickingField('from'); setSearchQuery(''); setLocations([]); setShowCountryPicker(true); }}>
                  <MapPin size={22} color={COLORS.primary} style={{marginRight: 4}} />
                  <Text style={[styles.input, !from && { color: COLORS.gray400 }]} numberOfLines={1}>{from || "Leaving from..."}</Text>
                </Pressable>
                <View style={styles.inputDivider} />
                <Pressable style={styles.inputItem} onPress={() => { setPickingField('to'); setSearchQuery(''); setLocations([]); setShowCountryPicker(true); }}>
                  <Navigation size={22} color={COLORS.accentLemonDark} style={{marginRight: 4}} />
                  <Text style={[styles.input, !to && { color: COLORS.gray400 }]} numberOfLines={1}>{to || "Heading to..."}</Text>
                </Pressable>
              </View>
              
              <TouchableOpacity style={styles.calendarTrigger} onPress={() => setShowCalendar(true)}>
                 <CalendarIcon size={20} color={COLORS.gray400} />
                 <Text style={[styles.calendarText, !date && { color: COLORS.gray400 }]}>{date || "Select Date"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primarySearchBtn} onPress={() => router.push({ pathname: '/trips-list', params: { from, to, date } })}>
                <Text style={styles.primarySearchBtnText}>Search Available Travelers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.walletCardHero}>
               <View style={styles.walletHeaderHero}>
                  <View style={styles.walletIconBoxHero}><Wallet size={24} color={COLORS.white} /></View>
                  <View>
                     <Text style={styles.walletLabelHero}>EARNED BALANCE</Text>
                      <Text style={styles.walletValueHero}>{formatCurrency(wallet.balance)}</Text>
                  </View>
               </View>
               <TouchableOpacity style={styles.postTripCta} onPress={() => handleActionWithTerms(() => router.push('/post-trip'))}>
                  <Plus size={20} color={COLORS.primary} />
                  <Text style={styles.postTripCtaText}>Publish New Itinerary</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dynamic Promo Banner */}
        {bannerConfig?.isActive !== false && (
          <View style={styles.promoBannerContainer}>
             <Image 
                source={{ uri: bannerConfig?.imageUrl || 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&auto=format&fit=crop' }} 
                style={styles.promoBannerImg} 
             />
             <View style={styles.promoBannerInfo}>
                <Text style={styles.promoBannerTag}>{bannerConfig?.tag || 'DESTINATION SPECIAL'}</Text>
                <Text style={styles.promoBannerTitle}>{bannerConfig?.title || 'Lagos to London'}</Text>
                <Text style={styles.promoBannerDesc}>{bannerConfig?.description || 'Ship your packages starting from ...'}</Text>
                <TouchableOpacity 
                   style={styles.promoBannerBtn}
                   onPress={() => bannerConfig?.redirectLink && router.push(bannerConfig.redirectLink as any)}
                >
                   <Text style={styles.promoBannerBtnText}>{bannerConfig?.buttonText || 'Check Flights'}</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}

        <View style={styles.section}>
           <Text style={styles.sectionTitle}>More with Bago</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
              {MORE_SERVICES.map(service => (
                 <Pressable key={service.id} style={[styles.serviceCard, { backgroundColor: service.color }]} onPress={() => router.push(service.route as any)}>
                    <View style={styles.serviceIconCircle}>{service.icon}</View>
                    <Text style={styles.serviceTitleText}>{service.title}</Text>
                    <Text style={styles.serviceDescText}>{service.desc}</Text>
                 </Pressable>
              ))}
           </ScrollView>
        </View>

        <View style={[styles.section, { minHeight: 180 }]}>
          <Text style={styles.sectionTitle}>Top Destination</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routesScroll} scrollEnabled={true}>
            {HIGH_DEMAND_ROUTES.map((route, index) => (
              <Pressable key={route.id || index} style={styles.routeCard} onPress={() => console.log('Route pressed:', route.from)}>
                <Image 
                  source={{ uri: route.image }} 
                  style={styles.routeImg} 
                  resizeMode="cover"
                  onLoad={() => console.log(`Image loaded: ${route.from}`)}
                  onError={(e) => console.log(`Image error: ${route.from}`, e.nativeEvent.error)}
                />
                <View style={styles.routeOverlay}>
                   <Text style={styles.routeLabelText}>{route.from} → {route.to}</Text>
                   <View style={styles.routeTagBadge}><Text style={styles.routeTagBadgeText}>{route.tag}</Text></View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Date Picker Sheet */}
      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.bottomSheet, { height: '65%' }]}>
               <View style={styles.sheetHeader}>
                 <Text style={styles.sheetTitle}>Select Date</Text>
                 <TouchableOpacity onPress={() => setShowCalendar(false)}><X size={24} color={COLORS.black} /></TouchableOpacity>
               </View>
              
              <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                     <ChevronLeft size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                     <ChevronRight size={24} color={COLORS.primary} />
                  </TouchableOpacity>
              </View>

              <View style={styles.weekDaysRow}>
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <Text key={`${day}-${idx}`} style={styles.weekDayText}>{day}</Text>
                 ))}
              </View>
              
              <View style={styles.calendarGrid}>
                 {renderCalendar()}
              </View>

              <TouchableOpacity style={[styles.primarySearchBtn, { marginTop: 20 }]} onPress={() => setShowCalendar(false)}>
                 <Text style={styles.primarySearchBtnText}>Confirm Date</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Country/City Picker Sheet (Expanded Global Search with Flags) */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Global Location Search</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}><X size={24} color={COLORS.black} /></TouchableOpacity>
            </View>
            <View style={styles.sheetSearchBox}>
               <Search size={20} color={COLORS.gray400} />
               <TextInput 
                  placeholder="Where are you heading?" 
                  style={styles.sheetSearchInput} 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
               />
               {loadingLocations && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>
            
            <FlatList
              data={locations.length > 0 ? locations : [
                { name: 'London, United Kingdom', country_code: 'gb' },
                { name: 'Lagos, Nigeria', country_code: 'ng' },
                { name: 'New York, USA', country_code: 'us' },
                { name: 'Paris, France', country_code: 'fr' },
                { name: 'Toronto, Canada', country_code: 'ca' },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.cityItem} onPress={() => { if (pickingField === 'from') setFrom(item.name); else setTo(item.name); setShowCountryPicker(false); }}>
                   <Text style={[styles.cityTextRow, { fontSize: 24, marginRight: 12 }]}>{getFlagEmoji(item.country_code)}</Text>
                   <Text style={styles.cityTextRow}>{item.name}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showAgreement} animationType="fade" transparent>
        <View style={styles.modalOverlayWide}>
          <View style={styles.agreementCard}>
            <ShieldCheck size={48} color={COLORS.primary} style={{ alignSelf: 'center' }} />
            <Text style={styles.agreementTitle}>Escrow Security</Text>
            <Text style={styles.agreementText}>Payments are held securely in Bago Escrow until the item is delivered.</Text>
            <TouchableOpacity style={styles.agreementBtn} onPress={() => { acceptTerms(); setShowAgreement(false); }}><Text style={styles.agreementBtnText}>Accept & Continue</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.gray100,
    gap: 4
  },
  headerLeft: { 
    flex: 1,
    minWidth: 80,
  },
  headerCenter: { 
    flex: 2,
    flexDirection: 'row', 
    backgroundColor: COLORS.bgSoft, 
    borderRadius: 14, 
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: { 
    flex: 1,
    minWidth: 40,
    alignItems: 'flex-end' 
  },
  headerModeBtn: { 
    flex: 1,
    paddingVertical: 6, 
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerModeBtnActive: { 
    backgroundColor: COLORS.white, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  headerModeLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: COLORS.gray500 
  },
  headerModeLabelActive: { 
    color: COLORS.primary 
  },
  logo: { width: 90, height: 32 },
  profileBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },

  heroSection: { padding: 20, paddingTop: 10 },
  welcomeMsg: { fontSize: 12, color: COLORS.gray500, fontWeight: '500', marginBottom: 4, letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '600', color: COLORS.black, lineHeight: 28, letterSpacing: -0.4 },
  
  searchCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 4, marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10, borderWidth: 1, borderColor: COLORS.gray100 },
  inputStack: { paddingHorizontal: 16, paddingVertical: 8 },
  inputItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 50 },
  input: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.black },
  inputDivider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 4, marginLeft: 34 },
  
  calendarTrigger: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.bgSoft },
  calendarText: { fontSize: 15, fontWeight: '700', color: COLORS.black },

  primarySearchBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primarySearchBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  walletCardHero: { backgroundColor: COLORS.black, borderRadius: 28, padding: 24 },
  walletHeaderHero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  walletIconBoxHero: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  walletLabelHero: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800' },
  walletValueHero: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  postTripCta: { backgroundColor: COLORS.white, height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  postTripCtaText: { color: COLORS.black, fontSize: 15, fontWeight: '800' },

  promoBannerContainer: { marginHorizontal: 24, marginBottom: 32, height: 160, borderRadius: 28, overflow: 'hidden', flexDirection: 'row', backgroundColor: COLORS.primary, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  promoBannerImg: { width: '45%', height: 160, opacity: 0.8 },
  promoBannerInfo: { flex: 1, padding: 20, justifyContent: 'center' },
  promoBannerTag: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  promoBannerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  promoBannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', lineHeight: 16, marginBottom: 12 },
  promoBannerBtn: { backgroundColor: COLORS.white, paddingHorizontal: 12, height: 32, borderRadius: 8, alignSelf: 'flex-start', justifyContent: 'center' },
  promoBannerBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },

  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 16 },

  routesScroll: { paddingRight: 24 },
  routeCard: { width: 220, height: 140, borderRadius: 24, marginRight: 16, overflow: 'hidden', backgroundColor: COLORS.bgSoft },
  routeImg: { width: 220, height: 140 },
  routeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' },
  routeLabelText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  routeTagBadge: { backgroundColor: COLORS.accentLemon, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  routeTagBadgeText: { color: COLORS.black, fontSize: 10, fontWeight: '800' },

  servicesScroll: { paddingRight: 24 },
  serviceCard: { width: 160, borderRadius: 24, padding: 20, marginRight: 16 },
  serviceIconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  serviceTitleText: { fontSize: 15, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  serviceDescText: { fontSize: 11, color: COLORS.gray500, fontWeight: '600', lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: COLORS.white, height: '75%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  sheetSearchBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgSoft, paddingHorizontal: 16, height: 50, borderRadius: 16, marginBottom: 20 },
  sheetSearchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.black },
  cityItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, flexDirection: 'row', alignItems: 'center' },
  cityTextRow: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  modalOverlayWide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  agreementCard: { backgroundColor: COLORS.white, borderRadius: 32, padding: 32 },
  agreementTitle: { fontSize: 18, fontWeight: '900', color: COLORS.black, marginVertical: 16, textAlign: 'center' },
  agreementText: { fontSize: 14, color: COLORS.gray600, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  agreementBtn: { backgroundColor: COLORS.primary, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  agreementBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },

  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  calendarMonthText: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  weekDayText: { fontSize: 12, fontWeight: '700', color: COLORS.gray400, width: width / 9, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  calendarDay: { width: width / 8.5, height: 44, alignItems: 'center', justifyContent: 'center', margin: 2, borderRadius: 22 },
  calendarDayEmpty: { width: width / 8.5, height: 44, margin: 2 },
  calendarDaySelected: { backgroundColor: COLORS.primary },
  calendarDayText: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  calendarDayTextSelected: { color: COLORS.white },
});
