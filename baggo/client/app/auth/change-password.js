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
import { Package, Eye, EyeOff } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams(); // 👈 get user email passed from Verify OTP

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    if (!email) {
      setError('Missing email parameter. Please restart password reset.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }), // 👈 send email + password
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Password reset successfully!');
      setNewPassword('');
      setConfirmPassword('');
      console.log('Resetting password for:', email);

      // Navigate to Sign In screen after success
      setTimeout(() => router.push('/auth/signin'), 1500);
    } catch (err) {
      setError(err.message || 'An error occurred while resetting password');
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
          {/* New Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              placeholderTextColor={Colors.textLight}
              value={newPassword}
              onChangeText={setNewPassword}
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

          {/* Confirm Password */}
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/signin')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Back to <Text style={styles.linkTextBold}>Sign In</Text>
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
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
