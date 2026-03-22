import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export default function OTPScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string || 'your email';
  const type = params.type as string || 'verification'; // 'verification' or 'reset'
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Simulate verification
      setTimeout(() => {
        setLoading(false);
        if (type === 'reset') {
          router.push('/auth/reset-password');
        } else {
          router.replace('/(tabs)');
        }
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(60);
    Alert.alert('Sent!', 'A new verification code has been sent to your email.');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color={COLORS.black} />
            </Pressable>
          </View>

          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Verify it's you</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to <Text style={styles.emailHighlight}>{email}</Text>.
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => { otpRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null
                  ]}
                  value={digit}
                  onChangeText={v => handleOtpChange(v, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={loading || otp.join('').length < 6}
              style={({ pressed }) => [
                styles.verifyButton,
                (otp.join('').length < 6 || loading) && styles.disabledButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.verifyButtonText}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </Pressable>

            <View style={styles.resendBox}>
              <Text style={styles.resendText}>Didn't receive code?</Text>
              <Pressable onPress={handleResend} disabled={timer > 0}>
                <Text style={[styles.resendAction, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgOff,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray500,
    lineHeight: 22,
    marginBottom: 48,
  },
  emailHighlight: {
    color: COLORS.black,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  otpInput: {
    width: 48,
    height: 60,
    backgroundColor: COLORS.bgOff,
    borderWidth: 1.5,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  resendBox: {
    marginTop: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 15,
    color: COLORS.gray500,
  },
  resendAction: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '800',
  },
  resendDisabled: {
    color: COLORS.gray400,
    opacity: 0.6,
  },
});
