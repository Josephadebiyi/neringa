import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, AppState, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ShieldCheck, Lock, CreditCard, Landmark } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import paymentService from '../../lib/payment';

const AFRICAN_CURRENCIES = new Set([
  'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB',
  'GHS', 'GMD', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA',
  'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE',
  'SOS', 'SSP', 'STN', 'SZL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 'ZMW', 'ZWL',
]);

type Step = 'idle' | 'creating' | 'approving' | 'capturing' | 'done';

export default function PaymentScreen() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const params = useLocalSearchParams<{
    packageId: string;
    tripId: string;
    shipmentId: string;
    amount: string;
    currency: string;
    insurance: string;
    insuranceCost: string;
  }>();

  const currency = params.currency || user?.preferredCurrency || 'USD';
  const isAfrican = AFRICAN_CURRENCIES.has(currency);
  const amount = parseFloat(params.amount || '0');
  const insurance = params.insurance === 'true';
  const insuranceCost = parseFloat(params.insuranceCost || '0');

  const [step, setStep] = useState<Step>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [paystackRef, setPaystackRef] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/trips-list');
  };

  // ── PayPal flow ─────────────────────────────────────────────
  const handlePayPal = async () => {
    setStep('creating');
    try {
      const res = await paymentService.createPayPalOrder({
        packageId: params.packageId,
        tripId: params.tripId,
        shipmentId: params.shipmentId,
        currency,
        insurance,
        insuranceCost,
        paymentMethod: 'paypal_wallet',
      });

      if (!res.success || !res.data?.approvalUrl || !res.data?.orderId) {
        throw new Error(res.message || 'Could not create PayPal order.');
      }

      setOrderId(res.data.orderId);
      setApprovalUrl(res.data.approvalUrl);
      setStep('approving');
      await Linking.openURL(res.data.approvalUrl);
    } catch (e: any) {
      setStep('idle');
      Alert.alert('Payment Error', e.response?.data?.message || e.message || 'PayPal order could not be created.');
    }
  };

  // Called automatically when user returns from browser, or manually via button
  const handleCapture = async (id: string) => {
    if (step === 'capturing') return;
    setStep('capturing');
    try {
      const res = await paymentService.capturePayPalOrder(id);
      if (res.success) {
        setStep('done');
        router.replace({
          pathname: '/payment-success',
          params: { requestId: res.data?.request?.id, amount: String(amount), currency },
        });
      } else {
        setStep('approving');
        Alert.alert('Payment incomplete', res.message || 'Payment was not completed. Please approve via PayPal and try again.');
      }
    } catch (e: any) {
      setStep('approving');
      Alert.alert('Error', e.response?.data?.message || e.message || 'Could not confirm payment.');
    }
  };

  // ── Paystack flow ────────────────────────────────────────────
  const handlePaystack = async () => {
    setStep('creating');
    try {
      const res = await paymentService.initializePaystack({
        packageId: params.packageId,
        tripId: params.tripId,
        amount: amount * 100, // Paystack uses kobo/pesewas
        currency,
        insurance,
        insuranceCost,
      });

      if (!res.success || !res.data?.authorization_url) {
        throw new Error(res.message || 'Could not initialize Paystack payment.');
      }

      setPaystackRef(res.data.reference || null);
      setStep('approving');
      await Linking.openURL(res.data.authorization_url);
    } catch (e: any) {
      setStep('idle');
      Alert.alert('Payment Error', e.response?.data?.message || e.message || 'Paystack payment could not be started.');
    }
  };

  const handleVerifyPaystack = async (ref: string) => {
    if (step === 'capturing') return;
    setStep('capturing');
    try {
      const res = await paymentService.verifyPaystack(ref);
      if (res.success && res.data?.status === 'success') {
        setStep('done');
        router.replace({
          pathname: '/payment-success',
          params: { requestId: res.data?.metadata?.requestId, amount: String(amount), currency },
        });
      } else {
        setStep('approving');
        Alert.alert('Payment incomplete', res.message || 'Payment was not completed. Please pay via Paystack and try again.');
      }
    } catch (e: any) {
      setStep('approving');
      Alert.alert('Error', e.response?.data?.message || e.message || 'Could not confirm payment.');
    }
  };

  // Watch for user returning from the browser (PayPal or Paystack)
  // Defined after handlers so all references are in scope
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        step === 'approving'
      ) {
        if (orderId) handleCapture(orderId);
        else if (paystackRef) handleVerifyPaystack(paystackRef);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [step, orderId, paystackRef]);

  const isLoading = step === 'creating' || step === 'capturing';
  const isApproving = step === 'approving';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} disabled={isLoading}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(amount)}</Text>
          {insurance && insuranceCost > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>Insurance</Text>
              <Text style={styles.summaryValue}>{formatCurrency(insuranceCost)}</Text>
            </View>
          )}
        </View>

        {/* Payment method */}
        <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>

        {isApproving ? (
          <View style={styles.approvingCard}>
            <Text style={styles.approvingTitle}>Complete payment in your browser</Text>
            <Text style={styles.approvingDesc}>
              After approving the payment, come back here and tap the button below.
            </Text>
            <TouchableOpacity
              style={[styles.payBtn, { marginTop: 24 }]}
              onPress={() => {
                if (orderId) handleCapture(orderId);
                else if (paystackRef) handleVerifyPaystack(paystackRef);
              }}
            >
              <Text style={styles.payBtnText}>
                {isAfrican ? "I've paid — confirm payment" : "I've approved — confirm payment"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reopenBtn}
              onPress={() => approvalUrl && Linking.openURL(approvalUrl)}
            >
              <Text style={styles.reopenText}>Re-open payment page</Text>
            </TouchableOpacity>
          </View>
        ) : isAfrican ? (
          <TouchableOpacity
            style={[styles.methodCard, isLoading && styles.disabledBtn]}
            onPress={handlePaystack}
            disabled={isLoading}
          >
            <View style={[styles.methodIcon, { backgroundColor: '#E8FFF0' }]}>
              <CreditCard size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodLabel}>Pay with Paystack</Text>
              <Text style={styles.methodDesc}>Cards, bank transfer, USSD & more</Text>
            </View>
            {isLoading
              ? <ActivityIndicator color={COLORS.primary} />
              : <Text style={styles.methodArrow}>→</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.methodCard, isLoading && styles.disabledBtn]}
            onPress={handlePayPal}
            disabled={isLoading}
          >
            <View style={[styles.methodIcon, { backgroundColor: '#E8F0FE' }]}>
              <Landmark size={22} color="#003087" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodLabel}>Pay with PayPal</Text>
              <Text style={styles.methodDesc}>PayPal wallet, card or bank</Text>
            </View>
            {isLoading
              ? <ActivityIndicator color="#003087" />
              : <Text style={[styles.methodArrow, { color: '#003087' }]}>→</Text>}
          </TouchableOpacity>
        )}

        {/* Security badges */}
        <View style={styles.securityRow}>
          <View style={styles.securityBadge}>
            <Lock size={12} color={COLORS.gray} />
            <Text style={styles.securityText}>SSL Encrypted</Text>
          </View>
          <View style={styles.securityBadge}>
            <ShieldCheck size={12} color={COLORS.gray} />
            <Text style={styles.securityText}>Escrow Protected</Text>
          </View>
        </View>

        <Text style={styles.escrowNote}>
          Payment is held in escrow and only released to the traveler after you confirm delivery.
        </Text>
      </ScrollView>

      {!isApproving && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payBtn, isLoading && styles.disabledBtn]}
            onPress={isAfrican ? handlePaystack : handlePayPal}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.payBtnText}>
                  Pay {formatCurrency(amount)} via {isAfrican ? 'Paystack' : 'PayPal'}
                </Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: COLORS.primary, borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 32,
  },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 40, fontWeight: '900', color: COLORS.white, marginTop: 6 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  summaryItem: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  summaryValue: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.gray, letterSpacing: 1, marginBottom: 16 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.grayLight, borderRadius: 20, padding: 20, marginBottom: 12,
  },
  methodIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  methodDesc: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginTop: 2 },
  methodArrow: { fontSize: 18, color: COLORS.primary, fontWeight: '800' },
  approvingCard: {
    backgroundColor: '#FFFBEB', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 12, alignItems: 'center',
  },
  approvingTitle: { fontSize: 16, fontWeight: '800', color: '#92400E', textAlign: 'center', marginBottom: 8 },
  approvingDesc: { fontSize: 13, color: '#B45309', fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  reopenBtn: { marginTop: 16 },
  reopenText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  securityRow: { flexDirection: 'row', gap: 12, marginTop: 28, justifyContent: 'center' },
  securityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.grayLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  securityText: { fontSize: 11, fontWeight: '700', color: COLORS.gray },
  escrowNote: {
    fontSize: 12, color: COLORS.gray, fontWeight: '600', textAlign: 'center',
    lineHeight: 18, marginTop: 16,
  },
  footer: {
    paddingHorizontal: 24, paddingVertical: 20,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  payBtn: {
    backgroundColor: COLORS.black, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  payBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  disabledBtn: { opacity: 0.5 },
});
