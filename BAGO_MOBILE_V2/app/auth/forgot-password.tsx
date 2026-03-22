import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        router.push({
          pathname: '/auth/otp',
          params: { email, type: 'reset' }
        });
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={22} color={COLORS.black} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Don't worry, it happens! Enter your email and we'll send you an OTP to reset your password.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={COLORS.gray400} />
                <TextInput
                  placeholder="e.g. name@example.com"
                  placeholderTextColor={COLORS.gray400}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <Pressable
              onPress={handleReset}
              disabled={loading || !email}
              style={({ pressed }) => [
                styles.primaryButton,
                (!email || loading) && styles.disabledButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Send size={18} color={COLORS.white} />
              <Text style={styles.buttonText}>
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </Text>
            </Pressable>

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
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgOff,
    borderWidth: 1.5,
    borderColor: COLORS.gray100,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  successBox: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emailHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  resendLink: {
    marginTop: 24,
    padding: 10,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  resendPrimary: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
