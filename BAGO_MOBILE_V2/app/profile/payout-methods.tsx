import { View, Text, FlatList, Pressable, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Wallet, Plus, CheckCircle, Info, ChevronRight } from 'lucide-react-native';
import { Image } from 'react-native';
import { COLORS } from '../../constants/theme';

const MOCK_PAYOUTS = [
  { id: '1', bank: 'Chase Bank', account: '**** 4242', type: 'Primary', status: 'Verified' },
  { id: '2', bank: 'PayPal', account: 'joseph***@gmail.com', type: 'Secondary', status: 'Pending' },
];

export default function PayoutMethodsScreen() {
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Payout methods</Text>
        <TouchableOpacity>
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Current Earnings</Text>
          <Text style={styles.balanceAmount}>$244.00</Text>
          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawText}>Withdraw Now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>YOUR BANK ACCOUNTS</Text>
        {MOCK_PAYOUTS.map((item) => (
          <View key={item.id} style={styles.payoutCard}>
            <View style={styles.payoutIcon}>
              <Wallet size={24} color={item.status === 'Verified' ? COLORS.primary : COLORS.gray400} />
            </View>
            <View style={styles.payoutInfo}>
              <Text style={styles.bankName}>{item.bank}</Text>
              <Text style={styles.accountText}>{item.account}</Text>
              <View style={styles.statusRow}>
                <Text style={[styles.statusTag, { color: item.status === 'Verified' ? COLORS.accentLime : COLORS.accentAmber }]}>{item.status}</Text>
                {item.type === 'Primary' && <Text style={styles.primaryTag}>Primary</Text>}
              </View>
            </View>
            <CheckCircle size={20} color={item.status === 'Verified' ? COLORS.accentLime : COLORS.gray200} fill={item.status === 'Verified' ? COLORS.accentLime : 'none'} />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add Payout Method</Text>
        </TouchableOpacity>

        <View style={styles.gatewaySection}>
          <Text style={styles.sectionTitle}>ONBOARDING GATEWAYS</Text>
          <View style={styles.gatewayGrid}>
            <TouchableOpacity style={styles.gatewayItem}>
              <Image source={{ uri: 'https://cdn.brandfolder.io/5H442S3W/at/pge7x75p3jch3hxt62kqmj/Stripe_Logomark_-_Blue.png' }} style={styles.gatewayIcon} />
              <Text style={styles.gatewayLabel}>Stripe Connect</Text>
              <ChevronRight size={16} color={COLORS.gray400} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gatewayItem}>
              <Image source={{ uri: 'https://paystack.com/assets/payment/cards.png' }} style={styles.gatewayIcon} />
              <Text style={styles.gatewayLabel}>Paystack Payouts</Text>
              <ChevronRight size={16} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Info size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>Payouts are typically processed within 3-5 business days after delivery is confirmed by the sender.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  balanceInfo: { backgroundColor: COLORS.black, borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 32 },
  balanceLabel: { fontSize: 13, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 40, fontWeight: '800', color: COLORS.white, marginVertical: 8 },
  withdrawBtn: { backgroundColor: COLORS.accentLime, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 8 },
  withdrawText: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 16, marginTop: 10 },
  payoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 20, marginBottom: 16, gap: 16 },
  payoutIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  payoutInfo: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  accountText: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  statusTag: { fontSize: 12, fontWeight: '800' },
  primaryTag: { fontSize: 10, fontWeight: '800', color: COLORS.primary, backgroundColor: COLORS.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 20 },
  addBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  infoBox: { marginTop: 40, flexDirection: 'row', gap: 12, padding: 16, backgroundColor: COLORS.primarySoft, borderRadius: 16 },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, fontWeight: '600', lineHeight: 18 },
  gatewaySection: { marginTop: 32 },
  gatewayGrid: { gap: 12, marginTop: 4 },
  gatewayItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, padding: 16, borderRadius: 20, gap: 12 },
  gatewayIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.white },
  gatewayLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.black },
});
