import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Landmark, Mail, ShieldCheck, CheckCircle, X } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import paymentService from '../../lib/payment';

const AFRICAN_PAYOUT_CURRENCIES = new Set([
  'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB',
  'GHS', 'GMD', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA',
  'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE',
  'SOS', 'SSP', 'STN', 'SZL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 'ZMW', 'ZWL',
]);

export default function PayoutMethodsScreen() {
  const { user, refreshUser } = useAuth();
  const currency = user?.preferredCurrency || 'USD';
  const isAfrican = AFRICAN_PAYOUT_CURRENCIES.has(currency);

  // PayPal form state
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP modal state
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const existingPayPalEmail = (user as any)?.paypal_email;
  const hasBankLinked = !!(user as any)?.bankDetails?.accountNumber;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  // Step 1 — send OTP to the PayPal email
  const handleSendOtp = async () => {
    const email = paypalEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid PayPal email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await paymentService.sendPayPalPayoutOtp(email, currency);
      if (res.success) {
        setPendingEmail(email);
        setOtp('');
        setShowOtp(true);
      } else {
        Alert.alert('Error', res.message || 'Could not send verification code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP and save
  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await paymentService.verifyPayPalPayoutOtp(otp.trim());
      if (res.success) {
        setShowOtp(false);
        await refreshUser();
        Alert.alert('PayPal linked', 'Your PayPal payout account has been verified and saved.', [
          { text: 'OK', onPress: handleBack },
        ]);
      } else {
        Alert.alert('Failed', res.message || 'Incorrect code. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Verification failed', e.response?.data?.message || e.message || 'Incorrect code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Payout Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyLabel}>Your currency</Text>
          <Text style={styles.currencyValue}>{currency}</Text>
        </View>

        {isAfrican ? (
          <>
            <View style={styles.infoBox}>
              <ShieldCheck size={20} color="#059669" />
              <Text style={styles.infoText}>
                Payouts in <Text style={{ fontWeight: '800' }}>{currency}</Text> go directly to your linked bank account via Paystack.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>BANK ACCOUNT</Text>

            {hasBankLinked ? (
              <View style={styles.connectedCard}>
                <View style={styles.connectedIcon}>
                  <Landmark size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectedLabel}>{(user as any)?.bankDetails?.bankName}</Text>
                  <Text style={styles.connectedDetail}>
                    ••••{String((user as any)?.bankDetails?.accountNumber || '').slice(-4)}
                  </Text>
                </View>
                <CheckCircle size={20} color={COLORS.success} />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No bank account linked yet</Text>
              </View>
            )}

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile/add-bank')}>
              <Landmark size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>
                {hasBankLinked ? 'Change Bank Account' : 'Link Bank Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                Banks are loaded based on your <Text style={{ fontWeight: '800' }}>{currency}</Text> currency. Payouts process within 24–48 hours after delivery confirmation.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.infoBox, { backgroundColor: '#EFF6FF' }]}>
              <ShieldCheck size={20} color="#1D4ED8" />
              <Text style={[styles.infoText, { color: '#1E3A5F' }]}>
                Payouts in <Text style={{ fontWeight: '800' }}>{currency}</Text> are sent to your PayPal account. Your email will be verified with a code before saving.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>PAYPAL ACCOUNT</Text>

            {existingPayPalEmail ? (
              <View style={styles.connectedCard}>
                <View style={[styles.connectedIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Mail size={22} color="#003087" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectedLabel}>PayPal verified</Text>
                  <Text style={styles.connectedDetail}>{existingPayPalEmail}</Text>
                </View>
                <CheckCircle size={20} color={COLORS.success} />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No PayPal account linked yet</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {existingPayPalEmail ? 'Update PayPal email' : 'Enter your PayPal email'}
              </Text>
              <View style={styles.inputRow}>
                <Mail size={18} color={COLORS.gray} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.gray}
                  value={paypalEmail}
                  onChangeText={setPaypalEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#003087' }, loading && styles.disabledBtn]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.actionBtnText}>Send Verification Code</Text>}
            </TouchableOpacity>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                A 6-digit code will be sent to your PayPal email to confirm ownership. Payouts process within 24–48 hours after delivery.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* OTP verification modal */}
      <Modal visible={showOtp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.otpSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Verify PayPal Email</Text>
              <TouchableOpacity onPress={() => { setShowOtp(false); setOtp(''); }}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.otpMessage}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ fontWeight: '800', color: COLORS.black }}>{pendingEmail}</Text>
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="— — — — — —"
              placeholderTextColor={COLORS.gray300}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#003087' }, otpLoading && styles.disabledBtn]}
              onPress={handleVerifyOtp}
              disabled={otpLoading}
            >
              {otpLoading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.actionBtnText}>Confirm & Save</Text>}
            </TouchableOpacity>

            <Pressable onPress={handleSendOtp} style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Resend code</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  currencyBadge: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primaryLighter, borderRadius: 16, padding: 16, marginBottom: 24,
  },
  currencyLabel: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  currencyValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  infoBox: {
    flexDirection: 'row', gap: 12, backgroundColor: '#F0FDF4',
    padding: 16, borderRadius: 16, marginBottom: 28, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 20, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.gray, letterSpacing: 1, marginBottom: 14 },
  connectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.grayLight, borderRadius: 20, padding: 18, marginBottom: 16,
  },
  connectedIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
  },
  connectedLabel: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  connectedDetail: { fontSize: 13, color: COLORS.gray, fontWeight: '600', marginTop: 2 },
  emptyCard: {
    backgroundColor: COLORS.grayLight, borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.grayLight, borderRadius: 16, height: 56, paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.black },
  actionBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  actionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.6 },
  note: { marginTop: 24, padding: 16, backgroundColor: COLORS.grayLight, borderRadius: 16 },
  noteText: { fontSize: 12, color: COLORS.gray, fontWeight: '600', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  otpSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 28, paddingBottom: 48,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  otpMessage: { fontSize: 14, color: COLORS.gray, fontWeight: '600', lineHeight: 22, marginBottom: 24, textAlign: 'center' },
  otpInput: {
    backgroundColor: COLORS.grayLight, borderRadius: 16, height: 72,
    fontSize: 32, fontWeight: '900', color: COLORS.black, letterSpacing: 14, marginBottom: 24,
  },
});
