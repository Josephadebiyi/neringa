import { View, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Modal, Dimensions, Share } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ArrowLeft, Package, User, MapPin, 
  ShieldCheck, Download, 
  AlertTriangle, CheckCircle, ChevronRight,
  MessageSquare, FileText, X, Share2, Plus
} from 'lucide-react-native';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ShipmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  const [shipmentStatus, setShipmentStatus] = useState('In Transit');
  const [trackingCode] = useState('BAGO-' + Math.random().toString(36).substring(2, 9).toUpperCase());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Mock shipment data
  const shipment = {
    id: id || 'TKP01-EUFD24C',
    item: 'iPhone 15 Pro Max',
    category: 'Electronics',
    weight: '0.5kg',
    from: 'Madrid, Spain',
    to: 'Lisbon, Portugal',
    carrier: 'Sarah Johnson',
    receiverName: 'Carlos Silva',
    receiverAddress: 'Rua Augusta 123, Lisbon',
    images: [
      'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592890678914-710189bd3ad8?q=80&w=400&auto=format&fit=crop'
    ]
  };

  const handleShare = async () => {
    const message = `📦 BAGO SHIPMENT\nItem: ${shipment.item}\nStatus: ${shipmentStatus}\nTracking: ${trackingCode}\n\nTrack: https://bago.ca/track/${trackingCode}`;
    await Share.share({ message });
  };

  const updateStatus = (status: string) => {
    setShipmentStatus(status);
    setShowStatusModal(false);
    Alert.alert('Status Updated', `Shipment status changed to: ${status}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Clickable Image Slider */}
        <View style={styles.imageCard}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {shipment.images.map((img, i) => (
              <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => setSelectedImageUrl(img)}>
                <Image source={{ uri: img }} style={styles.mainImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText}>{shipment.images.length} Photos</Text>
          </View>
        </View>

        {/* Full Screen Image Modal */}
        <Modal visible={!!selectedImageUrl} transparent animationType="fade">
          <View style={styles.fullScreenOverlay}>
             <TouchableOpacity style={styles.closeFullBtn} onPress={() => setSelectedImageUrl(null)}>
                <X size={32} color={COLORS.white} />
             </TouchableOpacity>
             <Image source={{ uri: selectedImageUrl || '' }} style={styles.fullImage} resizeMode="contain" />
          </View>
        </Modal>

        <View style={styles.infoCard}>
           <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: shipmentStatus === 'Delivered' ? '#10B981' : COLORS.accentLemon }]} />
              <Text style={styles.statusText}>{shipmentStatus}</Text>
           </View>
           <Text style={styles.itemName}>{shipment.item}</Text>
           <Text style={styles.itemMeta}>{shipment.category} • {shipment.weight}</Text>
           
           <View style={styles.trackingBox}>
              <View style={styles.trackingInfo}>
                 <Text style={styles.trackingLabel}>TRACKING CODE</Text>
                 <Text style={styles.trackingValue}>{trackingCode}</Text>
              </View>
              <View style={styles.vDivider} />
              <TouchableOpacity style={styles.addStatusBtn} onPress={() => setShowStatusModal(true)}>
                 <Plus size={20} color={COLORS.primary} />
                 <Text style={styles.addStatusBtnText}>Status</Text>
              </TouchableOpacity>
           </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          <View style={styles.detailItem}>
             <View style={styles.iconCircle}><MapPin size={20} color={COLORS.gray400} /></View>
             <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Origin</Text>
                <Text style={styles.detailValue}>{shipment.from}</Text>
             </View>
          </View>
          <View style={styles.detailItem}>
             <View style={styles.iconCircle}><MapPin size={20} color={COLORS.primary} /></View>
             <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Destination</Text>
                <Text style={styles.detailValue}>{shipment.receiverAddress}</Text>
             </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties Involved</Text>
          <View style={styles.partyItem}>
             <View style={styles.partyAvatar}><User size={20} color={COLORS.gray400} /></View>
             <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Sender</Text>
                <Text style={styles.partyName}>Joseph Adenuga</Text>
             </View>
          </View>
          <TouchableOpacity style={styles.partyItem} onPress={() => router.push('/messages/1')}>
             <View style={styles.partyAvatar}><User size={20} color={COLORS.gray400} /></View>
             <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Carrier (Traveler)</Text>
                <Text style={styles.partyName}>{shipment.carrier}</Text>
             </View>
             <MessageSquare size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.partyItem}>
             <View style={styles.partyAvatar}><User size={20} color={COLORS.gray400} /></View>
             <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>Receiver</Text>
                <Text style={styles.partyName}>{shipment.receiverName}</Text>
             </View>
          </View>
        </View>

        <TouchableOpacity style={styles.downloadBtn} onPress={() => Alert.alert('Downloading', 'Your Shipping Label and Customs Declaration PDF is being generated.')}>
          <Download size={20} color={COLORS.primary} />
          <Text style={styles.downloadBtnText}>Download Shipping Documents</Text>
        </TouchableOpacity>

        {shipmentStatus !== 'Delivered' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => updateStatus('Delivered')}>
            <CheckCircle size={20} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.reportBtn} onPress={() => Alert.alert('Report', 'Support team notified.')}>
           <AlertTriangle size={18} color="#FF3B30" />
           <Text style={styles.reportBtnText}>Report a Problem</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Status Picker Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
           <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Update Shipment Status</Text>
              {[
                'Package Picked Up',
                'In Transit',
                'Released from Customs',
                'Out for Delivery',
                'Ready for Pickup'
              ].map(st => (
                <TouchableOpacity key={st} style={styles.sheetItem} onPress={() => updateStatus(st)}>
                   <Text style={styles.sheetItemText}>{st}</Text>
                   <ChevronRight size={18} color={COLORS.gray300} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowStatusModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  shareBtn: { padding: 8 },

  scrollContent: { padding: 20 },
  imageCard: { width: '100%', height: 260, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.bgSoft, marginBottom: 24 },
  mainImage: { width: width - 40, height: 260, resizeMode: 'cover' },
  imageBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  imageBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },

  fullScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeFullBtn: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%' },

  infoCard: { marginBottom: 32 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  itemName: { fontSize: 24, fontWeight: '900', color: COLORS.black, marginBottom: 4 },
  itemMeta: { fontSize: 15, color: COLORS.gray500, fontWeight: '600' },

  trackingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 20, marginTop: 24 },
  trackingInfo: { flex: 1 },
  trackingLabel: { fontSize: 10, fontWeight: '800', color: COLORS.gray400, marginBottom: 4 },
  trackingValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  vDivider: { width: 1, height: 30, backgroundColor: COLORS.gray200, marginHorizontal: 20 },
  addStatusBtn: { alignItems: 'center', gap: 4 },
  addStatusBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, color: COLORS.gray400, fontWeight: '700' },
  detailValue: { fontSize: 16, fontWeight: '700', color: COLORS.black },

  partyItem: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  partyAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  partyInfo: { flex: 1 },
  partyLabel: { fontSize: 12, color: COLORS.gray400, fontWeight: '700' },
  partyName: { fontSize: 15, fontWeight: '700', color: COLORS.black },

  primaryBtn: { height: 60, backgroundColor: COLORS.black, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  downloadBtn: { height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 20, backgroundColor: COLORS.primaryLight },
  downloadBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  reportBtn: { height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: '#FFEBEB', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 16 },
  reportBtnText: { color: '#FF3B30', fontSize: 15, fontWeight: '800' },

  spacer: { height: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  sheetItemText: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  cancelBtn: { marginTop: 24, height: 50, borderRadius: 12, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: COLORS.gray500, fontSize: 15, fontWeight: '700' },
});
