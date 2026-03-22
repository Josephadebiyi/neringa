import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft, Send, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export default function ChangeEmailScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Input Email, 2: OTP
  const [loading, setLoading] = useState(false);

  const handleSendCode = () => {
    if (!email.includes('@')) return Alert.alert('Invalid Email', 'Please enter a valid email address');
    setLoading(true);
    // Mock API
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      Alert.alert('Code Sent', 'Check your new email for a 6-digit verification code.');
    }, 1200);
  };

  const handleVerify = () => {
    if (otp.length < 4) return Alert.alert('Error', 'Please enter the verification code');
    setLoading(true);
    // Mock API
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Email Updated', 'Your primary email has been successfully updated.', [
        { text: 'Great', onPress: () => router.back() }
      ]);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Email</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          {step === 1 ? (
            <View style={styles.stepBox}>
              <View style={styles.iconCircle}><Mail size={32} color={COLORS.primary} /></View>
              <Text style={styles.title}>Update your email</Text>
              <Text style={styles.subtitle}>Enter the new email address you'd like to use. You'll need to verify it with an OTP.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Email Address</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity 
                style={[styles.primaryBtn, loading && styles.disabledBtn]} 
                onPress={handleSendCode}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Sending...' : 'Send Verification Code'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stepBox}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primarySoft }]}>
                <ShieldCheck size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Verify it's you</Text>
              <Text style={styles.subtitle}>We've sent a code to <Text style={styles.bold}>{email}</Text>. Enter it below to confirm the change.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput 
                  style={[styles.input, styles.otpInput]} 
                  placeholder="1 2 3 4"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <TouchableOpacity 
                style={[styles.primaryBtn, loading && styles.disabledBtn]} 
                onPress={handleVerify}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Verifying...' : 'Update Email Address'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
                <Text style={styles.resendText}>Change email address</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  
  scrollContent: { padding: 24, paddingTop: 40 },
  stepBox: { alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: COLORS.gray500, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  bold: { color: COLORS.black, fontWeight: '800' },
  
  inputGroup: { width: '100%', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '800', color: COLORS.gray700, marginBottom: 12 },
  input: { backgroundColor: COLORS.bgOff, borderRadius: 16, height: 56, paddingHorizontal: 20, fontSize: 16, color: COLORS.black, fontWeight: '700', borderWidth: 1, borderColor: COLORS.gray100 },
  otpInput: { letterSpacing: 8, textAlign: 'center', fontSize: 24 },
  
  primaryBtn: { width: '100%', height: 60, backgroundColor: COLORS.primary, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  disabledBtn: { opacity: 0.5 },
  resendBtn: { marginTop: 24, padding: 12 },
  resendText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
