import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { saveToken } from '@/utils/api';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignIn = async () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/baggo/signin', {
        email: email.toLowerCase(),
        password,
      });

      const data = response.data;

      // Handle both old and new response formats
      // Old format: { message: 'success', user: {...} }
      // New format: { success: true, token: '...', user: {...} }
      const isSuccess = data.success === true || (data.user && !data.message?.toLowerCase().includes('invalid'));
      
      if (!isSuccess) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Save the JWT token (new format)
      if (data.token) {
        await saveToken(data.token);
        console.log('Token saved successfully');
      }

      // Save user data to AsyncStorage
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        console.log('User data saved');
      }

      // Reset loading state
      setLoading(false);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Sign in error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during sign-in';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/bago-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Connect Travelers & Senders</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff color="#999" size={20} />
                ) : (
                  <Eye color="#999" size={20} />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              disabled={loading}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/auth/signup')}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 160,
    height: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
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
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#6366F1',
    fontWeight: '600',
  },
});
