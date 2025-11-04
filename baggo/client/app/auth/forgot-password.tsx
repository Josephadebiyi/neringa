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
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Package } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSuccess('OTP sent to your email.');
      setEmail('');

      // ✅ Navigate to OTP screen and pass the email
      setTimeout(() => {
        router.push({
          pathname: '/auth/verify-otp',
          params: { email },
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
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
          <Text style={styles.subtitle}>Reset Your Password</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/signin')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Remember your password?{' '}
              <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
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
