import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Chrome,
} from 'lucide-react-native';
import { Image } from 'react-native';
import { useGoogleAuth, processGoogleAuthResponse } from '../../lib/googleAuth';
import authService from '../../lib/auth';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

type SignUpStep = 'email' | 'name' | 'phone' | 'dob' | 'country' | 'password' | 'otp' | 'success';

const STEPS: SignUpStep[] = ['email', 'name', 'phone', 'dob', 'country', 'password', 'otp', 'success'];

const COUNTRIES = [
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
  { name: 'United States', code: 'US', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', currency: 'CAD', symbol: '$', flag: '🇨🇦' },
  { name: 'France', code: 'FR', currency: 'EUR', symbol: '€', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', currency: 'EUR', symbol: '€', flag: '🇩🇪' },
];

export default function SignUpScreen() {
  const [currentStep, setCurrentStep] = useState<SignUpStep>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // OTP refs
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const goToStep = (step: SignUpStep) => { animateTransition(() => setCurrentStep(step)); };

  const handleBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx <= 0) {
      if (router.canGoBack()) router.back();
      else router.replace('/auth/signin');
    } else {
      goToStep(STEPS[idx - 1]);
    }
  };

  const handleNext = async () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      if (currentStep === 'email' && !email) return Alert.alert('Required', 'Please enter your email');
      if (currentStep === 'name' && (!firstName || !lastName)) return Alert.alert('Required', 'Please enter your name');
      if (currentStep === 'phone' && !phone) return Alert.alert('Required', 'Please enter your phone number');
      if (currentStep === 'dob' && (!dobDay || !dobMonth || !dobYear)) return Alert.alert('Required', 'Please enter your birth date');
      if (currentStep === 'country' && !selectedCountry) return Alert.alert('Required', 'Please select your country');
      
      if (currentStep === 'password') {
        if (!password || password.length < 8) return Alert.alert('Error', 'Password must be 8+ characters');
        if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
        
        // STEP 1: REGISTER (SEND OTP)
        setLoading(true);
        try {
          const res = await authService.register({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            password,
            confirmPassword,
            country: selectedCountry.name,
            currency: selectedCountry.currency
          });
          
          if (res.signupToken) {
            setSignupToken(res.signupToken);
            setResendTimer(60);
          } else {
            throw new Error('Verification token not received');
          }
        } catch (error: any) {
          return Alert.alert('Error', error.message || 'Failed to start registration');
        } finally {
          setLoading(false);
        }
      }
      
      goToStep(STEPS[idx + 1]);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) return Alert.alert('Error', 'Enter 6-digit code');
    if (!signupToken) return Alert.alert('Error', 'Signup session expired');

    setLoading(true);
    try {
      await authService.verifySignup(signupToken, fullOtp);
      goToStep('success');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Incorrect code');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'email': return email.length > 0 && email.includes('@');
      case 'name': return firstName.length > 0 && lastName.length > 0;
      case 'phone': return phone.length >= 7;
      case 'dob': return dobDay.length > 0 && dobMonth.length > 0 && dobYear.length === 4;
      case 'country': return selectedCountry !== null;
      case 'password': return password.length >= 8 && password === confirmPassword;
      case 'otp': return otp.join('').length === 6;
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <Text style={styles.stepTitle}>What's your email?</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoFocus /></View>
          </>
        );
      case 'name':
        return (
          <>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoFocus /></View>
            <View style={[styles.inputContainer, { marginTop: 12 }]}><TextInput style={styles.input} placeholder="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" /></View>
          </>
        );
      case 'phone':
        return (
          <>
            <Text style={styles.stepTitle}>Phone Number</Text>
            <Text style={styles.stepDescription}>We'll use this for delivery updates.</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="+1 234 567 8900" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoFocus /></View>
          </>
        );
      case 'dob':
        return (
          <>
            <Text style={styles.stepTitle}>When were you born?</Text>
            <View style={styles.dobRow}>
               <TextInput style={[styles.input, styles.dobInput]} placeholder="DD" value={dobDay} onChangeText={setDobDay} keyboardType="number-pad" maxLength={2} autoFocus />
               <TextInput style={[styles.input, styles.dobInput]} placeholder="MM" value={dobMonth} onChangeText={setDobMonth} keyboardType="number-pad" maxLength={2} />
               <TextInput style={[styles.input, styles.dobYearInput]} placeholder="YYYY" value={dobYear} onChangeText={setDobYear} keyboardType="number-pad" maxLength={4} />
            </View>
          </>
        );
      case 'country':
        return (
          <>
            <Text style={styles.stepTitle}>Where are you located?</Text>
            <Text style={styles.stepDescription}>This determines your currency and payment methods (Stripe/Paystack).</Text>
            <View style={styles.countryList}>
               {COUNTRIES.map(c => (
                 <Pressable key={c.code} style={[styles.countryItem, selectedCountry?.code === c.code && styles.countryItemSelected]} onPress={() => setSelectedCountry(c)}>
                    <Text style={styles.countryFlag}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.countryName, selectedCountry?.code === c.code && styles.countryNameSelected]}>{c.name}</Text>
                       <Text style={styles.countryCurrency}>{c.currency} ({c.symbol})</Text>
                    </View>
                    {selectedCountry?.code === c.code && <CheckCircle size={20} color={COLORS.primary} />}
                 </Pressable>
               ))}
            </View>
          </>
        );
      case 'password':
        return (
          <>
            <Text style={styles.stepTitle}>Security</Text>
            <View style={styles.inputContainer}>
               <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoFocus />
               <Pressable onPress={() => setShowPassword(!showPassword)}><Eye size={20} color={COLORS.gray400} /></Pressable>
            </View>
            <View style={[styles.inputContainer, { marginTop: 12 }]}>
               <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
            </View>
          </>
        );
      case 'otp':
        return (
          <>
            <Text style={styles.stepTitle}>Verify email</Text>
            <Text style={styles.stepDescription}>We've sent a 6-digit code to {email}</Text>
            <View style={styles.otpRow}>
               {otp.map((d, i) => (
                 <TextInput 
                    key={i} 
                    ref={(r: any) => { otpRefs.current[i] = r; }}
                    style={styles.otpInput} 
                    value={d} 
                    onChangeText={t => handleOtpChange(t, i)} 
                    keyboardType="number-pad" 
                    maxLength={1} 
                    onKeyPress={(e) => { if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus(); }} 
                 />
               ))}
            </View>
          </>
        );
      case 'success':
        return (
          <View style={styles.successBox}>
             <CheckCircle size={80} color={COLORS.primary} />
             <Text style={styles.successTitle}>Welcome to Bago!</Text>
             <Text style={styles.successDesc}>Your wallet has been set to {selectedCountry?.symbol} (0.00)</Text>
          </View>
        );
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          {currentStep !== 'success' && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(STEPS.indexOf(currentStep) / (STEPS.length - 1)) * 100}%` }]} />
            </View>
          )}
          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
            {currentStep !== 'success' && (
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}><ArrowLeft size={22} color={COLORS.black} /></TouchableOpacity>
            )}
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              {renderStepContent()}
            </Animated.View>
          </ScrollView>

          <View style={styles.bottom}>
            {currentStep === 'success' ? (
              <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.finishBtn}>
                <Text style={styles.finishBtnText}>Go to Dashboard</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={currentStep === 'otp' ? handleVerifyOtp : handleNext} disabled={!canProceed() || loading} style={[styles.fab, (!canProceed() || loading) && styles.fabDisabled]}>
                 {loading ? <ActivityIndicator color={COLORS.white} /> : <ArrowRight size={24} color={COLORS.white} />}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  progressBar: { height: 4, backgroundColor: COLORS.bgSoft, marginHorizontal: 24, borderRadius: 2, marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  scrollContent: { paddingBottom: 100 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', margin: 24 },
  content: { padding: 24 },
  stepTitle: { fontSize: 26, fontWeight: '900', color: COLORS.black, marginBottom: 12 },
  stepDescription: { fontSize: 15, color: COLORS.gray500, marginBottom: 24, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 16, paddingHorizontal: 16, height: 60 },
  input: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.black },
  dobRow: { flexDirection: 'row', gap: 12 },
  dobInput: { flex: 1, backgroundColor: COLORS.bgSoft, padding: 16, borderRadius: 16, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  dobYearInput: { flex: 2, backgroundColor: COLORS.bgSoft, padding: 16, borderRadius: 16, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  countryList: { gap: 12 },
  countryItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, backgroundColor: COLORS.bgSoft, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  countryItemSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.white, elevation: 5, shadowColor: COLORS.primary, shadowOffset: { width:0, height:4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  countryFlag: { fontSize: 24 },
  countryName: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  countryNameSelected: { color: COLORS.primary },
  countryCurrency: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  otpInput: { width: 44, height: 56, backgroundColor: COLORS.bgSoft, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '800' },
  successBox: { alignItems: 'center', marginTop: 80 },
  successTitle: { fontSize: 28, fontWeight: '900', color: COLORS.black, marginTop: 24 },
  successDesc: { fontSize: 16, color: COLORS.gray500, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  bottom: { padding: 24, alignItems: 'flex-end' },
  fab: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.black, alignItems: 'center', justifyContent: 'center' },
  fabDisabled: { opacity: 0.3 },
  finishBtn: { width: '100%', height: 60, backgroundColor: COLORS.black, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  finishBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '800' }
});
