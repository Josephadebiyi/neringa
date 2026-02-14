// SignUp.tsx
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
  callingCode: string; // e.g. "1" or "234"
  flag?: string; // emoji
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
  const [success, setSuccess] = useState(''); // new success message
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  // Date of birth state
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { colors } = useTheme();

  // Countries + picker state
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
                const root = c.idd.root; // e.g. "+1"
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

  // Simple email format validation (client-side)
  const isValidEmail = (value: string) => {
    // conservative regex: checks basic email format
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim().toLowerCase());
  };

  const handleSignUp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    // basic required fields
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !dateOfBirth || !selectedCountry) {
      setError('Please fill in all fields including date of birth and country');
      setLoading(false);
      return;
    }

    // email validation
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
      // build full phone (E.164-like): remove leading zeros from local number
      const calling = selectedCountry?.callingCode || '';
      const sanitizedLocal = phone.replace(/^0+/, '').replace(/\D/g, '');
      const fullPhone = calling ? `+${calling}${sanitizedLocal}` : phone;

      const payload = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        country: selectedCountry.name, // Send country name as string
        dateOfBirth: dateOfBirth, // Date of birth in YYYY-MM-DD format
        password,
        confirmPassword,
        referralCode: referralCode.trim() || null,
      };

      const response = await api.post('/api/baggo/signup', payload);
      const data = response.data;

      // Show verification modal
      setLoading(false);
  setShowVerifyModal(true); // show the modal instead of inline message


      // optionally navigate after a short delay or require verification first.
      // If you want to redirect immediately uncomment next line:
      // router.replace('/(tabs)');

    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    (`+${c.callingCode}`).includes(countrySearch)
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/bago-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Create Your Account</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={Colors.textLight}
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={Colors.textLight}
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.input}
              onPress={() => setCountryModalVisible(true)}
              disabled={countriesLoading || loading}
            >
              <Text style={{ color: selectedCountry ? Colors.text : Colors.textLight }}>
                {selectedCountry
                  ? `${selectedCountry.flag}  ${selectedCountry.name}`
                  : 'Select Country'}
              </Text>
            </TouchableOpacity>
            {/* Country selector + phone number */}
            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countryPickerButton} onPress={() => setCountryModalVisible(true)} disabled={countriesLoading || loading}>
                <Text style={styles.flagText}>{selectedCountry?.flag ?? '🏳️'}</Text>
                <Text style={styles.callingCodeText}>{selectedCountry?.callingCode ? `+${selectedCountry.callingCode}` : 'Code'}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {/* Date of Birth */}
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD)"
              placeholderTextColor={Colors.textLight}
              value={dateOfBirth}
              onChangeText={(text) => {
                // Auto-format: add dashes as user types
                let formatted = text.replace(/[^0-9]/g, '');
                if (formatted.length > 4) {
                  formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
                }
                if (formatted.length > 7) {
                  formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
                }
                if (formatted.length > 10) {
                  formatted = formatted.slice(0, 10);
                }
                setDateOfBirth(formatted);
              }}
              keyboardType="numeric"
              maxLength={10}
              editable={!loading}
            />

            {/* Password field with toggle */}
  <View style={styles.passwordContainer}>
    <TextInput
      style={styles.passwordInput}
      placeholder="Password"
      placeholderTextColor={Colors.textLight}
      value={password}
      onChangeText={setPassword}
      secureTextEntry={!showPassword}
      editable={!loading}
    />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      {showPassword ? (
        <EyeOff color={Colors.textLight} size={20} />
      ) : (
        <Eye color={Colors.textLight} size={20} />
      )}
    </TouchableOpacity>
  </View>

  {/* Confirm Password field with toggle */}
  <View style={styles.passwordContainer}>
    <TextInput
      style={styles.passwordInput}
      placeholder="Confirm Password"
      placeholderTextColor={Colors.textLight}
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      secureTextEntry={!showConfirmPassword}
      editable={!loading}
    />
    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
      {showConfirmPassword ? (
        <EyeOff color={Colors.textLight} size={20} />
      ) : (
        <Eye color={Colors.textLight} size={20} />
      )}
    </TouchableOpacity>
  </View>


            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}


            <TextInput
              style={styles.input}
              placeholder="Referral Code (optional)"
              placeholderTextColor={Colors.textLight}
              value={referralCode}
              onChangeText={setReferralCode}
              editable={!loading}
            />

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignUp} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => router.back()} disabled={loading}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country modal */}
      <Modal visible={countryModalVisible} animationType="slide" onRequestClose={() => setCountryModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <TouchableOpacity onPress={() => setCountryModalVisible(false)}><Text style={styles.modalClose}>Close</Text></TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput style={styles.searchInput} placeholder="Search by country or code (e.g. United, +1)" placeholderTextColor={Colors.textLight} value={countrySearch} onChangeText={setCountrySearch} />
          </View>

          {countriesLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.cca2 + item.callingCode}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryRow} onPress={() => onSelectCountry(item)}>
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countrySub}>{item.cca2}</Text>
                  </View>
                  <Text style={styles.countryDial}>+{item.callingCode}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          )}
        </SafeAreaView>
      </Modal>
      {/* ✅ Verification Modal */}
<Modal
  visible={showVerifyModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowVerifyModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.verifyModalContent}>
      <Text style={styles.verifyTitle}>Verify Your Email</Text>
      <Text style={styles.verifyMessage}>
        A verification email has been sent to{" "}
        <Text style={{ fontWeight: '600' }}>{email}</Text>.{"\n"}
        Please check your inbox and click the link to verify your account.
      </Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => {
          setShowVerifyModal(false);
          router.push('/auth/signin'); // or the actual login route
        }}
      >
        <Text style={styles.loginButtonText}>Go to Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setShowVerifyModal(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 150, height: 60, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8 },
  form: { width: '100%' },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E8E8E8',
  borderRadius: 12,
  backgroundColor: '#F8F8F8',
  paddingHorizontal: 12,
  marginBottom: 16,
},
passwordInput: {
  flex: 1,
  paddingVertical: 14,
  fontSize: 16,
  color: '#333',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
verifyModalContent: {
  width: '85%',
  backgroundColor: Colors.white,
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
  color: Colors.primary,
  marginBottom: 12,
},
verifyMessage: {
  fontSize: 14,
  color: Colors.text,
  textAlign: 'center',
  marginBottom: 24,
  lineHeight: 20,
},
loginButton: {
  backgroundColor: Colors.primary,
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 24,
  marginBottom: 12,
},
loginButtonText: {
  color: Colors.white,
  fontWeight: '600',
  fontSize: 16,
},
closeButton: {
  paddingVertical: 8,
},
closeButtonText: {
  color: Colors.textLight,
  fontSize: 14,
},

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryPickerButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRightWidth: 1, borderRightColor: Colors.border, backgroundColor: Colors.white },
  flagText: { fontSize: 20, marginRight: 8 },
  callingCodeText: { fontSize: 14, color: Colors.text },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, color: Colors.text },
  button: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  error: { color: Colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  success: { color: 'green', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { color: Colors.textLight, fontSize: 14 },
  linkTextBold: { color: Colors.primary, fontWeight: '600' },

  /* Modal styles */
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  modalClose: { color: Colors.primary, fontWeight: '600' },
  searchRow: { padding: 12, backgroundColor: Colors.white },
  searchInput: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  countryRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.white },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { fontSize: 16, color: Colors.text },
  countrySub: { fontSize: 12, color: Colors.textLight },
  countryDial: { fontSize: 14, color: Colors.textLight },
  sep: { height: 1, backgroundColor: Colors.border },
});
