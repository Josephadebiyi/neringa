import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Landmark, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
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
  const [loading, setLoading] = useState(false);

  const existingPayPalEmail = (user as any)?.paypal_email;
  const hasBankLinked = !!(user as any)?.bankDetails?.accountNumber;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const handleConnectPayPal = async () => {
    setLoading(true);
    try {
      const { oauthUrl } = await paymentService.startPayPalOAuth();
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl, 'com.bago.mobile://paypal-callback');
      if (result.type === 'success') {
        const url = new URL(result.url);
        const status = url.searchParams.get('status');
        if (status === 'success') {
          await refreshUser();
          Alert.alert('PayPal connected', 'Your PayPal account has been linked. Payouts will be sent there automatically.', [
            { text: 'Done', onPress: handleBack },
          ]);
        } else {
          const reason = url.searchParams.get('reason');
          const msg = reason === 'cancelled'
            ? 'PayPal login was cancelled.'
            : reason === 'wrong_currency'
            ? `Your currency (${currency}) requires a bank account, not PayPal.`
            : 'Could not link PayPal. Please try again or contact support.';
          Alert.alert('Connection failed', msg);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'Could not start PayPal login.');
    } finally {
      setLoading(false);
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
                Payouts in <Text style={{ fontWeight: '800' }}>{currency}</Text> are sent to your PayPal account. Log in with PayPal to link your account securely.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>PAYPAL ACCOUNT</Text>

            {existingPayPalEmail ? (
              <View style={styles.connectedCard}>
                <View style={[styles.connectedIcon, { backgroundColor: '#EFF6FF' }]}>
                  <CheckCircle size={22} color="#003087" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectedLabel}>PayPal connected</Text>
                  <Text style={styles.connectedDetail}>{existingPayPalEmail}</Text>
                </View>
                <CheckCircle size={20} color={COLORS.success} />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No PayPal account linked yet</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#003087' }, loading && styles.disabledBtn]}
              onPress={handleConnectPayPal}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.actionBtnText}>
                    {existingPayPalEmail ? 'Reconnect PayPal' : 'Connect PayPal'}
                  </Text>}
            </TouchableOpacity>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                You'll be redirected to PayPal to log in. Your account will be linked automatically. Payouts process within 24–48 hours after delivery.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
  actionBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  actionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.6 },
  note: { marginTop: 24, padding: 16, backgroundColor: COLORS.grayLight, borderRadius: 16 },
  noteText: { fontSize: 12, color: COLORS.gray, fontWeight: '600', lineHeight: 18 },
});
