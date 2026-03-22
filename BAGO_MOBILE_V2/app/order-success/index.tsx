import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  CheckCircle2, Copy, Share2, MapPin, 
  Calendar, Package, ArrowRight, ShieldCheck, FileText, Download 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

import { COLORS } from '../../constants/theme';

export default function OrderSuccessScreen() {
  const trackingNumber = 'BAGO-2023-XYZ';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        {/* Celebration Header */}
        <View style={styles.header}>
          <View style={styles.successIconBg}>
            <CheckCircle2 size={80} color={COLORS.accentLime} />
          </View>
          <Text style={styles.title}>Trip Submitted!</Text>
          <Text style={styles.subtitle}>
            Your trip has been successfully submitted and is <Text style={styles.pendingText}>Pending Admin Approval</Text>. We'll notify you once it's verified and live.
          </Text>
        </View>

        {/* Tracking/Ticket Card */}
        <View style={styles.ticketCard}>
          <View style={styles.trackingBox}>
            <Text style={styles.trackingLabel}>Trip ID</Text>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingValue}>{trackingNumber}</Text>
              <Pressable style={styles.copyBtn}>
                <Copy size={16} color={COLORS.primary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.routeBox}>
            <View style={styles.routeItem}>
              <View style={styles.marker} />
              <View style={styles.routeText}>
                <Text style={styles.locationTitle}>Madrid, Spain</Text>
                <Text style={styles.dateText}>Oct 24, 2023 • 10:00 AM</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={[styles.marker, { backgroundColor: COLORS.accentLime }]} />
              <View style={styles.routeText}>
                <Text style={styles.locationTitle}>Lisbon, Portugal</Text>
                <Text style={styles.dateText}>Oct 24, 2023 • 04:30 PM</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <DetailItem label="Cargo" value="Medium Box" icon={<Package size={14} color={COLORS.gray400} />} />
            <DetailItem label="Earnings" value="$25/pkg" icon={<ShieldCheck size={14} color={COLORS.gray400} />} />
          </View>
        </View>

        <Pressable style={styles.shareBtn}>
          <Share2 size={20} color={COLORS.primary} />
          <Text style={styles.shareText}>Share your Trip</Text>
        </Pressable>

        <TouchableOpacity 
          style={styles.pdfBtn}
          onPress={() => Alert.alert('Downloading PDF...', 'The shipment agreement has been generated and sent to your email.')}
        >
          <FileText size={20} color={COLORS.black} />
          <Text style={styles.pdfBtnText}>Download Shipment PDF</Text>
          <Download size={18} color={COLORS.gray400} />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/trips')}
          >
            <Text style={styles.primaryBtnText}>Go to My Trips</Text>
            <ArrowRight size={20} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailItem({ label, value, icon }: any) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailHeader}>
        {icon}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  pendingText: {
    color: COLORS.accentAmber,
    fontWeight: '800',
  },
  ticketCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 32,
  },
  trackingBox: {
    marginBottom: 24,
  },
  trackingLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  trackingValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  copyBtn: {
    padding: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  routeBox: {
    gap: 4,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.gray200,
    marginLeft: 5,
  },
  routeText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    marginBottom: 40,
  },
  shareText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 20, gap: 12, marginBottom: 32, width: '100%' },
  pdfBtnText: { flex: 1, fontSize: 16, fontWeight: '800', color: COLORS.black },
  actionGroup: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.gray600,
    fontSize: 16,
    fontWeight: '700',
  },
});
