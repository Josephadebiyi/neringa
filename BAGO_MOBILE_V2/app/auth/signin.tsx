import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet, Image, Dimensions } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, Chrome } from '../../components/Icon';
import { useGoogleAuth, processGoogleAuthResponse } from '../../lib/googleAuth';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';

const { height } = Dimensions.get('window');

export default function SignInScreen() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { request, response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (response) handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    setGoogleLoading(true);
    try {
      const result = await processGoogleAuthResponse(response);
      if (result.success) {
        try {
          await googleLogin({ idToken: result.idToken, accessToken: result.accessToken });
          router.replace('/(tabs)');
        } catch (backendError: any) {
          if (backendError.response?.status === 404 || backendError.response?.status === 400) {
            router.replace('/(tabs)');
          } else {
            Alert.alert('Authentication Error', backendError.message || 'Failed to authenticate.');
          }
        }
      } else if (result.error && result.error !== 'User cancelled the authentication') {
        Alert.alert('Google Sign In', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await promptAsync();
    } catch {
      Alert.alert('Error', 'Failed to initiate Google sign in');
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const serverMessage = error.response?.data?.message?.toLowerCase() || '';
      const isUnauthorized = error.response?.status === 401 || error.response?.status === 400;
      const isCredentialError =
        serverMessage.includes('invalid') || serverMessage.includes('wrong') ||
        serverMessage.includes('password') || error.message?.toLowerCase().includes('credential');
      if (isUnauthorized && isCredentialError) {
        Alert.alert('Wrong Password', 'The email or password you entered is incorrect.');
      } else {
        Alert.alert('Sign In Failed', error.response?.data?.message || error.message || 'Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Hero */}
      <View style={styles.hero}>
        <Image source={require('../../assets/welcome-hero.jpg')} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <Image source={require('../../assets/bago-logo-white.png')} style={styles.heroLogo} resizeMode="contain" />
          <Text style={styles.heroTitle}>Welcome back</Text>
        </SafeAreaView>
      </View>

      {/* Form */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={COLORS.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
              {showPassword ? <EyeOff size={20} color={COLORS.gray400} /> : <Eye size={20} color={COLORS.gray400} />}
            </Pressable>
          </View>

          {/* Forgot */}
          <Pressable style={styles.forgotRow} onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {/* Log In */}
          <Pressable
            style={[styles.btn, styles.btnPrimary, (!email || !password) && { opacity: 0.4 }]}
            onPress={handleSignIn}
            disabled={loading || !email || !password}
          >
            <Text style={styles.btnTextWhite}>{loading ? 'Signing in...' : 'Log In'}</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>

          {/* Google */}
          <Pressable
            style={[styles.btn, styles.btnDark, (googleLoading || !request) && { opacity: 0.5 }]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || !request}
          >
            <Chrome size={20} color={COLORS.white} />
            <Text style={styles.btnTextWhite}>{googleLoading ? 'Connecting...' : 'Continue with Google'}</Text>
          </Pressable>

          {/* Sign up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Not a member yet? </Text>
            <Pressable onPress={() => router.push('/auth/signup')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },

  hero: { height: height * 0.32, position: 'relative' },
  heroImg: { position: 'absolute', width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)' },
  heroSafe: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 24 },
  heroLogo: { width: 110, height: 38, marginBottom: 10 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },

  form: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },

  label: { fontSize: 13, fontWeight: '700', color: COLORS.gray700, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgOff,
    borderWidth: 1.5, borderColor: COLORS.gray100,
    borderRadius: 14, paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: COLORS.black },
  eye: { padding: 4 },

  forgotRow: { alignItems: 'flex-end', marginTop: 10, marginBottom: 24 },
  forgotText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 50, gap: 10 },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDark: { backgroundColor: COLORS.black },
  btnTextWhite: { color: COLORS.white, fontSize: 17, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.gray100 },
  divText: { paddingHorizontal: 14, color: COLORS.gray400, fontSize: 12, fontWeight: '800' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  signupText: { fontSize: 15, color: COLORS.gray500 },
  signupLink: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
});
