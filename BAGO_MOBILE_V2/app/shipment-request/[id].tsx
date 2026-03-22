import { View, Text, ScrollView, Pressable, StyleSheet, Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, Package, User, 
  MapPin, Mail, ShieldCheck, 
  Check, X, MessageSquare, Info
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ShipmentRequestDetails() {
  const { id } = useLocalSearchParams();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/trips');
  };

  const handleAccept = () => {
    Alert.alert(
      "Accept Request?", 
      "Once accepted, you'll be connected with the sender via chat. Please stick to our safety rules.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Accept", onPress: () => router.push('/messages/1') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Details</Text>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Item Image Gallery */}
        <View style={styles.imageBox}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=600&auto=format&fit=crop' }} 
            style={styles.mainImg}
          />
          <View style={styles.imgBadge}>
            <Text style={styles.imgBadgeText}>1 of 1</Text>
          </View>
        </View>

        {/* Item Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeIconBox}>
              <Package size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.itemName}>iPhone 15 Pro Max</Text>
              <Text style={styles.itemCategory}>Electronics • 0.5kg</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Sender's Notes</Text>
          <Text style={styles.itemDesc}>
            Brand new in box. Sealed. Needs to be delivered to my brother in Lagos. 
            He will meet you at the airport or we can arrange a drop-off.
          </Text>
        </View>

        {/* Receiver Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Receiver Details</Text>
          
          <View style={styles.detailRow}>
            <User size={18} color={COLORS.gray400} />
            <View>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailVal}>Tolu Adelaja</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={18} color={COLORS.gray400} />
            <View>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailVal}>12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Mail size={18} color={COLORS.gray400} />
            <View>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailVal}>tolu.a@email.com</Text>
            </View>
          </View>
        </View>

        {/* Safety Warning */}
        <View style={styles.safetyBox}>
          <ShieldCheck size={20} color={COLORS.primary} />
          <Text style={styles.safetyText}>
            Escrow Protected: Your payment is guaranteed by Bago upon successful delivery.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.declineBtn} onPress={() => router.back()}>
          <X size={20} color={COLORS.black} />
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
          <Check size={20} color={COLORS.white} />
          <Text style={styles.acceptText}>Accept Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgOff },
  flex: { flex: 1 },
  header: { padding: 20, paddingTop: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginTop: -36 },
  
  scrollContent: { paddingBottom: 120 },
  imageBox: { height: 300, backgroundColor: COLORS.black },
  mainImg: { width: '100%', height: '100%', opacity: 0.9 },
  imgBadge: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  imgBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  
  card: { backgroundColor: COLORS.white, borderRadius: 32, padding: 24, marginHorizontal: 20, marginTop: -20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  typeIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  itemCategory: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gray400, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16 },
  itemDesc: { fontSize: 15, color: COLORS.gray700, lineHeight: 22, fontWeight: '600' },
  
  detailRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  detailLabel: { fontSize: 12, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase' },
  detailVal: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginTop: 2 },
  
  safetyBox: { marginHorizontal: 20, backgroundColor: COLORS.primarySoft, padding: 20, borderRadius: 24, flexDirection: 'row', gap: 12, alignItems: 'center' },
  safetyText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '700', lineHeight: 18 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 34, backgroundColor: COLORS.white, flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  declineBtn: { flex: 1, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: COLORS.gray200, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  declineText: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  acceptBtn: { flex: 2, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  acceptText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  
  bottomSpacer: { height: 120 },
});
