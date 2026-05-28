import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Package, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useCurrency } from '../../hooks/useCurrency';

export default function PaymentSuccessScreen() {
  const { formatCurrency } = useCurrency();
  const params = useLocalSearchParams<{
    requestId: string;
    amount: string;
    currency: string;
  }>();

  const amount = parseFloat(params.amount || '0');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <CheckCircle size={72} color={COLORS.success} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your payment is held securely in escrow.</Text>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.infoBox}>
          <Package size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Your shipment request has been created. The traveler will be notified and can now accept your delivery.
          </Text>
        </View>

        <View style={styles.stepList}>
          <Step number="1" label="Traveler accepts your request" done />
          <Step number="2" label="Traveler picks up & delivers your package" />
          <Step number="3" label="You confirm delivery — funds released to traveler" />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/trips')}
        >
          <Text style={styles.primaryBtnText}>View My Shipments</Text>
          <ArrowRight size={18} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Step({ number, label, done }: { number: string; label: string; done?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, done && styles.stepNumDone]}>
        <Text style={[styles.stepNumText, done && styles.stepNumTextDone]}>{number}</Text>
      </View>
      <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 48, alignItems: 'center' },
  iconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.black, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.gray, fontWeight: '600', textAlign: 'center', marginBottom: 28 },
  amountCard: {
    backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 36,
    alignItems: 'center', marginBottom: 24, width: '100%',
  },
  amountLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  amountValue: { fontSize: 36, fontWeight: '900', color: COLORS.white, marginTop: 4 },
  infoBox: {
    flexDirection: 'row', gap: 12, backgroundColor: COLORS.primaryLighter,
    padding: 16, borderRadius: 16, marginBottom: 28, alignItems: 'flex-start', width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600', lineHeight: 20 },
  stepList: { width: '100%', gap: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNum: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  stepNumDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepNumText: { fontSize: 13, fontWeight: '800', color: COLORS.gray },
  stepNumTextDone: { color: COLORS.white },
  stepLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray, flex: 1 },
  stepLabelDone: { color: COLORS.black },
  footer: { paddingHorizontal: 24, paddingBottom: 28, gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.black, height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  secondaryBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
});
