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
import { Package } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const { email } = useLocalSearchParams();

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
      setTimeout(() => router.push({ pathname: '/auth/change-password', params: { email } }), 1000);
    } catch (err: any) {
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
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setSuccess('OTP resent successfully. Please check your email.');
    } catch (err: any) {
      setError(err.message || 'Error resending OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F8F6F3' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Package size={60} color={'#5845D8'} strokeWidth={2} />
          <Text style={[styles.title, { color: '#5845D8' }]}>BAGGO</Text>
          <Text style={[styles.subtitle, { color: '#6B6B6B' }]}>Verify Your OTP</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: '#F3F4F6', borderColor: '#E5E5E5', color: '#1A1A1A' }]}
            placeholder="Enter OTP"
            placeholderTextColor={'#9E9E9E'}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            editable={!loading}
            maxLength={6}
          />

          {error ? <Text style={[styles.error, { color: '#F44336' }]}>{error}</Text> : null}
          {success ? <Text style={[styles.success, { color: '#4CAF50' }]}>{success}</Text> : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#5845D8' }, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={'#FFFFFF'} />
            ) : (
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleResendOtp}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator color={'#5845D8'} />
            ) : (
              <Text style={[styles.linkText, { color: '#6B6B6B' }]}>
                Didn't receive an OTP?{' '}
                <Text style={[styles.linkTextBold, { color: '#5845D8' }]}>Resend</Text>
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
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  success: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: '600',
  },
});
