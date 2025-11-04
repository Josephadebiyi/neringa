import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Package,Eye, EyeOff } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';


export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Assuming successful sign-in redirects to tabs
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'An error occurred during sign-in');
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
          <Text style={styles.subtitle}>Connect Travelers & Senders</Text>
        </View>

        <View style={styles.form}>
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword} // <-- this line fixed
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
              <ActivityIndicator color={Colors.white} />
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
forgotPasswordButton: {
  alignSelf: 'flex-end',
  marginBottom: 12,
},

forgotPasswordText: {
  color: Colors.primary,
  fontSize: 14,
  fontWeight: '500',
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
