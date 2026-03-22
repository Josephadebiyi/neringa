import { View, Text, ScrollView, Pressable, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, ShieldCheck, Zap, 
  MapPin, Clock, AlertTriangle, 
  CheckCircle2, Info, Package,
  TrendingUp, Globe, FileText
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const TOPICS: Record<string, any> = {
  posting: {
    title: 'How to post a trip on Bago',
    icon: <Zap size={44} color={COLORS.primary} />,
    content: [
      { subtitle: '1. Set Your Route', text: 'Enter your departure and arrival cities. Our system automatically detects the countries for you.' },
      { subtitle: '2. Define Availability', text: 'Set your travel date, time, and how much luggage space (in kg) you can spare.' },
      { subtitle: '3. Upload Verification', text: 'To maintain security, carriers must upload a travel ticket or booking proof before posting.' },
      { subtitle: '4. Start Earning', text: "Once approved, senders will see your trip and send you requests. You're in control!" },
    ]
  },
  tracking: {
    title: 'Tracking your package efficiently',
    icon: <TrendingUp size={44} color={COLORS.primary} />,
    content: [
      { subtitle: 'Real-time Updates', text: 'Every trip has a dedicated tracking number. Carriers update the shipment status at key milestones.' },
      { subtitle: 'In-App Notifications', text: 'Get notified immediately when your package is picked up, transit-scanned, or ready for collection.' },
      { subtitle: 'Direct Chat', text: 'Communicate with your carrier through our secure messaging system for precise hand-over timing.' },
    ]
  },
  restricted: {
    title: 'What items are restricted?',
    icon: <AlertTriangle size={44} color={COLORS.primary} />,
    content: [
      { subtitle: 'Legal & Safety First', text: 'Bago strictly prohibits illegal substances, weapons, flammable materials, and counterfeit goods.' },
      { subtitle: 'Fragile & Perishable', text: 'Fresh food or extremely fragile glass items are discouraged unless specially agreed with the carrier.' },
      { subtitle: 'Local Regulations', text: 'Always check the customs rules of your destination country before sending items.' },
    ]
  },
  escrow: {
    title: 'Bago Escrow Payment Protection',
    icon: <ShieldCheck size={44} color={COLORS.primary} />,
    content: [
      { subtitle: 'How it works', text: "When you pay for a shipment, the money isn't sent directly to the carrier. It's held in Bago's secure escrow vault." },
      { subtitle: 'The Release Process', text: 'Only once the sender confirms they have received the package in good condition do we release the funds.' },
      { subtitle: '100% Security', text: 'This system protects both parties: senders are guaranteed delivery, and carriers are guaranteed payment.' },
    ]
  }
};

export default function HelpDetailScreen() {
  const { topic } = useLocalSearchParams();
  const data = TOPICS[topic as string] || TOPICS.posting;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.flex} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroBox}>
          <View style={styles.iconContainer}>{data.icon}</View>
          <Text style={styles.title}>{data.title}</Text>
        </View>

        <View style={styles.contentBox}>
          {data.content.map((item: any, i: number) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{item.subtitle}</Text>
              <Text style={styles.sectionText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBanner}>
          <Info size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>Need more help? Reach out to Bago support 24/7.</Text>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 10,
    backgroundColor: COLORS.white,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: COLORS.bgSoft, 
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 10
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: COLORS.black,
    flex: 1,
    textAlign: 'center'
  },
  headerSpacer: { width: 44 },
  
  scrollContent: { paddingHorizontal: 24, paddingVertical: 12 },
  heroBox: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryLighter, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.black, textAlign: 'center', lineHeight: 34 },
  
  contentBox: { gap: 32 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sectionText: { fontSize: 15, color: COLORS.gray600, lineHeight: 24, fontWeight: '600' },
  
  infoBanner: { marginTop: 60, flexDirection: 'row', gap: 12, backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 24, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: COLORS.black, fontWeight: '700' },
  bottomSpacer: { height: 120 },
});
