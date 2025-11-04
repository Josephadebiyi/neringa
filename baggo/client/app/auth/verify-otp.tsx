import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Package } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const { email } = useLocalSearchParams(); // 👈 Get user email passed from previous screen

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!otp) {
      setError('Please enter your OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      setSuccess('OTP verified successfully!');

      // ✅ Navigate to reset password screen, passing the email along
      setTimeout(() => router.push({ pathname: '/auth/change-password', params: { email } }), 1000);
    } catch (err) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), // 👈 resend for the same email
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setSuccess('OTP resent successfully. Please check your email.');
    } catch (err) {
      setError(err.message || 'Error resending OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Package size={60} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.title}>BAGGO</Text>
          <Text style={styles.subtitle}>Verify Your OTP</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor={Colors.textLight}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            editable={!loading}
            maxLength={6}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleResendOtp}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.linkText}>
                Didn’t receive an OTP?{' '}
                <Text style={styles.linkTextBold}>Resend</Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  success: {
    color: Colors.success || '#22c55e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  linkTextBold: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
