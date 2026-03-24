import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Landmark, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';
import { useCurrency } from '../../hooks/useCurrency';
import api from '../../lib/api';
import currencyService from '../../lib/currency';

const AFRICAN_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'RWF', 'EGP', 'MAD'];
const MIN_NGN = 1000; // 1000 NGN minimum

export default function WithdrawScreen() {
  const { user } = useAuth();
  const { formatCurrency, currencySymbol } = useCurrency();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [minWithdrawal, setMinWithdrawal] = useState(10); // default fallback

  const isAfricanCurrency = AFRICAN_CURRENCIES.includes(user?.preferredCurrency || '');
  const hasBankLinked = !!(user?.bankDetails?.accountNumber && user?.bankDetails?.bankName);
  const hasStripeConnected = !!(user as any)?.stripeConnectAccountId;
  const hasPayoutMethod = isAfricanCurrency ? hasBankLinked : hasStripeConnected;

  useEffect(() => {
    fetchBalance();
    fetchMinimum();
  }, []);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await api.get('/api/bago/getWallet');
      setBalance(res.data.balance || 0);
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchMinimum = async () => {
    try {
      const userCurrency = user?.preferredCurrency || 'USD';
      if (userCurrency === 'NGN') {
        setMinWithdrawal(MIN_NGN);
      } else {
        const converted = await currencyService.convert(MIN_NGN, 'NGN', userCurrency);
        setMinWithdrawal(Math.ceil(converted));
      }
    } catch {
      setMinWithdrawal(10); // fallback
    }
  };

  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/earnings');
      }
    } catch {
      router.replace('/(tabs)/earnings');
    }
  };

  const handleAmountChange = (text: string) => {
    // Strip everything except digits and dots
    let cleaned = text.replace(/[^0-9.]/g, '');
    // Only allow one decimal point
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
      cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
    }
    // Limit to 2 decimal places
    const parts = cleaned.split('.');
    if (parts[1] !== undefined && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setAmount(cleaned);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const platformFee = parsedAmount * 0.1;
  const youReceive = parsedAmount * 0.9;

  const handleWithdraw = async () => {
    if (!hasPayoutMethod) {
      Alert.alert(
        'No Payout Method',
        isAfricanCurrency
          ? 'Please add a bank account before withdrawing.'
          : 'Please connect your Stripe account before withdrawing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isAfricanCurrency ? 'Add Bank' : 'Connect Stripe',
            onPress: () => router.push(isAfricanCurrency ? '/profile/add-bank' : '/profile/payout-methods'),
          },
        ]
      );
      return;
    }

    if (parsedAmount < minWithdrawal) {
      Alert.alert('Minimum Amount', `Minimum withdrawal is ${formatCurrency(minWithdrawal)}.`);
      return;
    }

    if (parsedAmount > balance) {
      Alert.alert('Insufficient Balance', `Your available balance is ${formatCurrency(balance)}.`);
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${formatCurrency(parsedAmount)}?\n\nPlatform fee (10%): ${formatCurrency(platformFee)}\nYou receive: ${formatCurrency(youReceive)}\n\nProcessed within 24–48 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitWithdrawal },
      ]
    );
  };

  const submitWithdrawal = async () => {
    setLoading(true);
    try {
      const payload: any = {
        amount: parsedAmount,
        method: isAfricanCurrency ? 'bank' : 'stripe',
      };

      if (isAfricanCurrency && user?.bankDetails) {
        payload.bankDetails = user.bankDetails;
      }

      const res = await api.post('/api/bago/withdrawFunds', payload);

      if (res.data.success) {
        Alert.alert(
          'Withdrawal Requested',
          res.data.message || 'Your withdrawal is being processed.',
          [{ text: 'OK', onPress: handleBack }]
        );
      } else {
        throw new Error(res.data.message || 'Withdrawal failed');
      }
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || e.message || 'Could not process withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {balanceLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          )}
          <Text style={styles.balanceCurrency}>{user?.preferredCurrency || 'USD'}</Text>
        </View>

        {/* No payout method warning */}
        {!hasPayoutMethod && (
          <TouchableOpacity
            style={styles.warningBox}
            onPress={() => router.push(isAfricanCurrency ? '/profile/add-bank' : '/profile/payout-methods')}
          >
            <AlertCircle size={20} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>No payout method linked</Text>
              <Text style={styles.warningDesc}>
                {isAfricanCurrency ? 'Tap to add a bank account' : 'Tap to connect Stripe'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Payout method summary */}
        {hasPayoutMethod && (
          <View style={styles.methodCard}>
            {isAfricanCurrency ? (
              <>
                <View style={styles.methodIcon}>
                  <Landmark size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{user?.bankDetails?.bankName}</Text>
                  <Text style={styles.methodDetail}>••••{user?.bankDetails?.accountNumber?.slice(-4)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.methodIcon}>
                  <CreditCard size={22} color="#635BFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>Stripe Connect</Text>
                  <Text style={styles.methodDetail}>International payout</Text>
                </View>
              </>
            )}
            <TouchableOpacity onPress={() => router.push('/profile/payout-methods')}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WITHDRAWAL AMOUNT</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.gray300}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              maxLength={15}
            />
          </View>
          <TouchableOpacity
            onPress={() => setAmount(balance.toFixed(2))}
            style={styles.maxBtn}
          >
            <Text style={styles.maxBtnText}>Max: {formatCurrency(balance)}</Text>
          </TouchableOpacity>
        </View>

        {/* Fee breakdown */}
        {parsedAmount > 0 && (
          <View style={styles.feeBox}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Withdrawal amount</Text>
              <Text style={styles.feeValue}>{formatCurrency(parsedAmount)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Platform fee (10%)</Text>
              <Text style={[styles.feeValue, { color: COLORS.error }]}>−{formatCurrency(platformFee)}</Text>
            </View>
            <View style={[styles.feeRow, styles.feeTotalRow]}>
              <Text style={styles.feeTotalLabel}>You receive</Text>
              <Text style={styles.feeTotalValue}>{formatCurrency(youReceive)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.withdrawBtn, (loading || parsedAmount <= 0) && styles.disabledBtn]}
          onPress={handleWithdraw}
          disabled={loading || parsedAmount <= 0}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
          )}
        </TouchableOpacity>

        <View style={styles.legalRow}>
          <ShieldCheck size={16} color={COLORS.gray400} />
          <Text style={styles.legalText}>
            Withdrawals are processed within 24–48 hours. A 10% platform fee applies.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24, paddingBottom: 48 },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  balanceValue: { fontSize: 42, fontWeight: '900', color: COLORS.white, marginTop: 6, letterSpacing: -1 },
  balanceCurrency: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningTitle: { fontSize: 14, fontWeight: '800', color: '#92400E' },
  warningDesc: { fontSize: 12, color: '#B45309', fontWeight: '600', marginTop: 2 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.bgSoft,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  methodDetail: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  changeText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 14 },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSoft,
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 72,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  currencySymbol: { fontSize: 28, fontWeight: '800', color: COLORS.gray400, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '900', color: COLORS.black },
  maxBtn: { alignSelf: 'flex-end', marginTop: 10 },
  maxBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  feeBox: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    gap: 12,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 14, color: COLORS.gray600, fontWeight: '600' },
  feeValue: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  feeTotalRow: { borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 12, marginTop: 4 },
  feeTotalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  feeTotalValue: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  withdrawBtn: {
    backgroundColor: COLORS.black,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  withdrawBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  disabledBtn: { opacity: 0.4 },
  legalRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  legalText: { flex: 1, fontSize: 12, color: COLORS.gray400, fontWeight: '600', lineHeight: 18 },
});
