// SignUp.tsx - Theme-aware version
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import api from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

type CountryItem = {
  name: string;
  cca2: string;
  callingCode: string;
  flag?: string;
};

const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag,flags';

function countryCodeToEmoji(cc: string) {
  if (!cc || cc.length !== 2) return '';
  const A = 65;
  return Array.from(cc.toUpperCase())
    .map(c => String.fromCodePoint(A + c.charCodeAt(0) - 65 + 0x1F1E6))
    .join('');
}

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { colors, isDark } = useTheme();

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchCountries() {
      try {
        setCountriesLoading(true);
        const res = await fetch(REST_COUNTRIES_URL);
        const data = await res.json();
        const mapped: CountryItem[] = data
          .map((c: any) => {
            let callingCode = '';
            try {
              if (c?.idd?.root) {
                const root = c.idd.root;
                const suffix = Array.isArray(c.idd.suffixes) && c.idd.suffixes.length > 0 ? c.idd.suffixes[0] : '';
                callingCode = `${root}${suffix}`.replace(/^\+/, '');
              }
            } catch (e) {
              callingCode = '';
            }
            const name = c?.name?.common || c?.name || 'Unknown';
            const cca2 = c?.cca2 || '';
            const flagEmoji = c?.flag || countryCodeToEmoji(cca2);
            return {
              name,
              cca2,
              callingCode: callingCode || '',
              flag: flagEmoji,
            };
          })
          .filter((c: CountryItem) => c.callingCode);

        mapped.sort((a: CountryItem, b: CountryItem) => a.name.localeCompare(b.name));
        if (!mounted) return;
        setCountries(mapped);
        const defaultCountry = mapped.find(c => c.cca2 === 'NG') || mapped[0] || null;
        setSelectedCountry(defaultCountry);
      } catch (e) {
        console.warn('Failed to fetch countries', e);
      } finally {
        if (mounted) setCountriesLoading(false);
      }
    }
    fetchCountries();
    return () => {
      mounted = false;
    };
  }, []);

  const onSelectCountry = (c: CountryItem) => {
    setSelectedCountry(c);
    setCountryModalVisible(false);
    setCountrySearch('');
  };

  const isValidEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim().toLowerCase());
  };

  const handleSignUp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !dateOfBirth || !selectedCountry) {
      setError('Please fill in all fields including date of birth and country');
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const calling = selectedCountry?.callingCode || '';
      const sanitizedLocal = phone.replace(/^0+/, '').replace(/\D/g, '');
      const fullPhone = calling ? `+${calling}${sanitizedLocal}` : phone;

      const payload = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        country: selectedCountry.name,
        dateOfBirth: dateOfBirth,
        password,
        confirmPassword,
        referralCode: referralCode.trim() || null,
      };

      const response = await api.post('/api/baggo/signup', payload);
      const data = response.data;

      setLoading(false);
      setShowVerifyModal(true);

    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.cca2.toLowerCase().includes(countrySearch.toLowerCase()) ||
    `+${c.callingCode}`.includes(countrySearch)
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create your Baggo account</Text>
          </View>

          <View style={styles.form}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
            {success ? <Text style={[styles.success, { color: colors.success }]}>{success}</Text> : null}

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder, 
                color: colors.inputText 
              }]}
              placeholder="First Name"
              placeholderTextColor={colors.inputPlaceholder}
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder, 
                color: colors.inputText 
              }]}
              placeholder="Last Name"
              placeholderTextColor={colors.inputPlaceholder}
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder, 
                color: colors.inputText 
              }]}
              placeholder="Email"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder, 
                color: colors.inputText 
              }]}
              placeholder="Date of Birth (YYYY-MM-DD)"
              placeholderTextColor={colors.inputPlaceholder}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              editable={!loading}
            />

            <View style={[styles.phoneContainer, { 
              borderColor: colors.inputBorder, 
              backgroundColor: colors.inputBackground 
            }]}>
              <TouchableOpacity
                style={[styles.countryPickerButton, { 
                  borderRightColor: colors.inputBorder, 
                  backgroundColor: colors.inputBackground 
                }]}
                onPress={() => setCountryModalVisible(true)}
                disabled={loading}
              >
                <Text style={styles.flagText}>{selectedCountry?.flag || ''}</Text>
                <Text style={[styles.callingCodeText, { color: colors.text }]}>
                  +{selectedCountry?.callingCode || ''}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.phoneInput, { color: colors.inputText }]}
                placeholder="Phone Number"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
              />
            </View>

            <View style={[styles.passwordContainer, { 
              borderColor: colors.inputBorder, 
              backgroundColor: colors.inputBackground 
            }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.inputText }]}
                placeholder="Password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.passwordContainer, { 
              borderColor: colors.inputBorder, 
              backgroundColor: colors.inputBackground 
            }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.inputText }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder, 
                color: colors.inputText 
              }]}
              placeholder="Referral Code (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={referralCode}
              onChangeText={setReferralCode}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => router.back()} disabled={loading}>
              <Text style={[styles.linkText, { color: colors.textLight }]}>
                Already have an account?{' '}
                <Text style={[styles.linkTextBold, { color: colors.primary }]}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country modal */}
      <Modal visible={countryModalVisible} animationType="slide" onRequestClose={() => setCountryModalVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { 
            borderBottomColor: colors.border, 
            backgroundColor: colors.card 
          }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select country</Text>
            <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchRow, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder, 
                color: colors.inputText 
              }]}
              placeholder="Search by country or code (e.g. United, +1)"
              placeholderTextColor={colors.inputPlaceholder}
              value={countrySearch}
              onChangeText={setCountrySearch}
            />
          </View>

          {countriesLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : (
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.cca2 + item.callingCode}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryRow, { backgroundColor: colors.card }]}
                  onPress={() => onSelectCountry(item)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.countrySub, { color: colors.textLight }]}>{item.cca2}</Text>
                  </View>
                  <Text style={[styles.countryDial, { color: colors.textLight }]}>+{item.callingCode}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.verifyModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.verifyTitle, { color: colors.primary }]}>Verify Your Email</Text>
            <Text style={[styles.verifyMessage, { color: colors.text }]}>
              A verification email has been sent to{' '}
              <Text style={{ fontWeight: '600' }}>{email}</Text>.{'\n'}
              Please check your inbox and click the link to verify your account.
            </Text>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowVerifyModal(false);
                router.push('/auth/signin');
              }}
            >
              <Text style={[styles.loginButtonText, { color: colors.textInverse }]}>Go to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowVerifyModal(false)}>
              <Text style={[styles.closeButtonText, { color: colors.textLight }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 150, height: 60, marginBottom: 8 },
  subtitle: { fontSize: 14, marginTop: 8 },
  form: { width: '100%' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  verifyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  verifyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  loginButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 14,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
  },
  flagText: { fontSize: 20, marginRight: 8 },
  callingCodeText: { fontSize: 14 },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16 },
  button: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  error: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  success: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14 },
  linkTextBold: { fontWeight: '600' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalClose: { fontWeight: '600' },
  searchRow: { padding: 12 },
  searchInput: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, borderWidth: 1 },
  countryRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { fontSize: 16 },
  countrySub: { fontSize: 12 },
  countryDial: { fontSize: 14 },
  sep: { height: 1 },
});
