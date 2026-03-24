import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Building2, CheckCircle, ShieldCheck, Search, X, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// Map currency → Paystack country code
const CURRENCY_COUNTRY_MAP: Record<string, string> = {
  NGN: 'NG',
  GHS: 'GH',
  KES: 'KE',
  ZAR: 'ZA',
  TZS: 'TZ',
  UGX: 'UG',
  RWF: 'RW',
  EGP: 'EG',
  MAD: 'MA',
};

export default function AddBankScreen() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [banksLoading, setBanksLoading] = useState(false);

  // OTP step
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setBanksLoading(true);
    try {
      const currency = user?.preferredCurrency || 'NGN';
      const country = CURRENCY_COUNTRY_MAP[currency] || 'NG';
      const res = await api.get(`/api/paystack/banks?country=${country}&currency=${currency}`);
      if (res.data.success && res.data.banks?.length > 0) {
        setBanks(res.data.banks);
      } else {
        Alert.alert('Error', 'Could not load bank list. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load banks. Check your connection.');
    } finally {
      setBanksLoading(false);
    }
  };

  const resolveAccount = async (num: string, code: string) => {
    if (num.length === 10 && code) {
      setVerifying(true);
      try {
        const res = await api.get(`/api/paystack/resolve?accountNumber=${num}&bankCode=${code}`);
        if (res.data.success) setAccountName(res.data.accountName);
        else setAccountName('');
      } catch {
        setAccountName('');
      } finally {
        setVerifying(false);
      }
    }
  };

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      resolveAccount(accountNumber, bankCode);
    } else {
      setAccountName('');
    }
  }, [accountNumber, bankCode]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  // Step 1: initiate — backend verifies account and sends OTP
  const handleSave = async () => {
    if (!bankCode || !accountNumber) {
      Alert.alert('Error', 'Please select a bank and enter your account number');
      return;
    }
    if (accountNumber.length !== 10) {
      Alert.alert('Error', 'Account number must be 10 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/paystack/add-bank', {
        accountNumber,
        bankCode,
        bankName,
      });
      if (res.data.success && res.data.requiresOtp) {
        setOtpMessage(res.data.message || 'A confirmation code was sent to your email.');
        setShowOtpModal(true);
      } else {
        throw new Error(res.data.message || 'Unexpected response');
      }
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || e.message || 'Could not initiate bank setup');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: confirm OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.post('/api/paystack/verify-bank-otp', { otp });
      if (res.data.success) {
        setShowOtpModal(false);
        Alert.alert('Success', 'Bank account linked successfully!', [
          { text: 'OK', onPress: handleBack },
        ]);
      } else {
        throw new Error(res.data.message);
      }
    } catch (e: any) {
      Alert.alert('Verification Failed', e.response?.data?.message || e.message || 'Invalid code');
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
        <Text style={styles.headerTitle}>Add Bank Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <ShieldCheck size={20} color="#059669" />
          <Text style={styles.infoBannerText}>Your bank details are encrypted and securely stored. We use them strictly for traveler payouts.</Text>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Bank *</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => { if (!banksLoading) setShowBankPicker(true); }}>
            <Building2 size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.input, !bankName && { color: COLORS.gray400 }]}>
              {banksLoading ? 'Loading banks...' : bankName || 'Select your bank'}
            </Text>
            {banksLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Account Number *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="0123456789"
              placeholderTextColor={COLORS.gray400}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              maxLength={10}
            />
            {verifying && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
        </View>

        {accountName ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Holder Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: COLORS.bgSoft, opacity: 0.8 }]}>
              <TextInput
                style={styles.input}
                value={accountName}
                editable={false}
                placeholderTextColor={COLORS.gray400}
              />
              <Check size={18} color={COLORS.success} />
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.disabledBtn]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? 'Verifying...' : 'Link Bank Account'}</Text>
        </TouchableOpacity>

        <View style={styles.secureNoteRow}>
          <CheckCircle size={14} color={COLORS.gray400} />
          <Text style={styles.secureNoteText}>Protected by bank-grade encryption</Text>
        </View>
      </ScrollView>

      {/* Bank picker modal */}
      <Modal visible={showBankPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Search size={20} color={COLORS.gray400} />
              <TextInput
                placeholder="Search banks..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {banksLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 12, color: COLORS.gray500, fontWeight: '600' }}>Loading banks...</Text>
              </View>
            ) : banks.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <Text style={{ color: COLORS.gray500, fontWeight: '600' }}>No banks loaded.</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={fetchBanks}>
                  <Text style={styles.saveBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={banks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={item => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => { setBankName(item.name); setBankCode(item.code); setShowBankPicker(false); setSearchQuery(''); }}
                  >
                    <Text style={styles.bankItemText}>{item.name}</Text>
                    {bankCode === item.code && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* OTP confirmation modal */}
      <Modal visible={showOtpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.otpSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Confirm Bank</Text>
              <TouchableOpacity onPress={() => { setShowOtpModal(false); setOtp(''); }}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <Text style={styles.otpMessage}>{otpMessage}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit code"
              placeholderTextColor={COLORS.gray400}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.saveBtn, otpLoading && styles.disabledBtn]}
              onPress={handleVerifyOtp}
              disabled={otpLoading}
            >
              <Text style={styles.saveBtnText}>{otpLoading ? 'Verifying...' : 'Confirm'}</Text>
            </TouchableOpacity>
            <Pressable onPress={handleSave} style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Resend Code</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  infoBanner: { flexDirection: 'row', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, alignItems: 'center', gap: 12, marginBottom: 32 },
  infoBannerText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 20, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 20 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 16, height: 56, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.black },
  saveBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.6 },
  secureNoteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, marginBottom: 40 },
  secureNoteText: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: COLORS.white, height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  otpSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  otpMessage: { fontSize: 14, color: COLORS.gray600, fontWeight: '600', lineHeight: 20, marginBottom: 24 },
  otpInput: { backgroundColor: COLORS.bgSoft, borderRadius: 16, height: 64, fontSize: 28, fontWeight: '800', color: COLORS.black, letterSpacing: 12, marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgSoft, paddingHorizontal: 16, height: 50, borderRadius: 16, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.black },
  bankItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankItemText: { fontSize: 16, fontWeight: '700', color: COLORS.black },
});
