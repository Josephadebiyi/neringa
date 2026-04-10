import { View, Pressable, StyleSheet, Image, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  Package, Check, ChevronRight, 
  ArrowRight, ShieldCheck, Globe
} from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// Premium Color Palette mapping to Bago's theme
const DESIGN_COLORS = {
  deepBlue: COLORS.primary, // Binding the background to the app's primary color
  cardIndigo: '#1E40AF', // Slightly different indigo for contrast if needed
  white: '#FFFFFF',
  indigoDark: COLORS.black, // Switch bottom pill to black for sleek contrast
  gray400: '#9CA3AF',
  gray600: '#4B5563',
};

import { secureStorage } from '../lib/storage';

export default function OnboardingScreen() {
  const { isAuthenticated, isLoading, googleLogin } = useAuth();
  const [checkingPersistence, setCheckingPersistence] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  
  // Slide Animations for the stacked look
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    async function checkStatus() {
      try {
        const hasSeen = await secureStorage.getItem('has_seen_onboarding');
        if (hasSeen === 'true' && !isAuthenticated) {
          router.replace('/auth/signin');
        }
      } catch (e) {
      } finally {
        setCheckingPersistence(false);
      }
    }

    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        checkStatus();
      }
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [isAuthenticated, isLoading]);

  const handleContinue = async () => {
    if (!termsAccepted || !policyAccepted) return;
    
    await secureStorage.setItem('has_seen_onboarding', 'true');
    router.replace('/auth/signin');
  };

  if (isLoading || checkingPersistence || isAuthenticated) return null;

  return (
    <View style={styles.container}>
      {/* Faint Background Image */}
      <Image 
        source={require('../assets/images/suitcase-bg.jpg')} 
        style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]} 
        resizeMode="cover"
      />
      
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Top Stacked Cards Area */}
          <View style={styles.stackContainer}>
            {/* The multi-card effect behind the main colored card */}
            <View style={[styles.bgCard, { opacity: 0.1, transform: [{ scale: 0.85 }, { translateY: -40 }] }]} />
            <View style={[styles.bgCard, { opacity: 0.2, transform: [{ scale: 0.9 }, { translateY: -25 }] }]} />
            <View style={[styles.bgCard, { opacity: 0.3, transform: [{ scale: 0.95 }, { translateY: -12 }] }]} />
            
            {/* Main Primary Card */}
            <View style={styles.primaryCard}>
               <Text style={styles.headline}>Let's start the{'\n'}amazing{'\n'}process!</Text>
               <View style={styles.heroLogoRow}>
                 <Globe size={32} color={Platform.OS === 'ios' ? '#FFFFFF40' : 'rgba(255,255,255,0.2)'} />
               </View>
            </View>
          </View>

          {/* Bottom Info Card Area */}
          <View style={styles.infoContainer}>
             {/* Info Cards Stack Background */}
             <View style={[styles.infoBgCard, { transform: [{ scale: 0.95 }, { translateY: -10 }], opacity: 0.4 }]} />
             
             {/* Main White Info Card */}
             <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Get ready{'\n'}for it!</Text>
                <Text style={styles.infoDescription}>
                   Bago makes international shipping simple, fast, and secure. Connect with travelers and get your items delivered globally.
                </Text>
             </View>
          </View>

          {/* Legal Options */}
          <View style={styles.legalSection}>
             <LegalCheck 
                label="Read and agreed to Deepmind Privacy Policy" 
                checked={policyAccepted} 
                onPress={() => setPolicyAccepted(!policyAccepted)}
             />
             <LegalCheck 
                label="Read and agreed to Deepmind T&C and EULA" 
                checked={termsAccepted} 
                onPress={() => setTermsAccepted(!termsAccepted)}
             />
          </View>

          {/* Continue Button */}
          <View style={styles.footer}>
             <TouchableOpacity 
               style={[styles.continueButton, (!termsAccepted || !policyAccepted) && styles.continueDisabled]} 
               onPress={handleContinue}
               activeOpacity={0.8}
             >
               <Text style={styles.continueText}>Continue</Text>
             </TouchableOpacity>

             <Pressable style={styles.loginLink} onPress={() => router.push('/auth/signin')}>
               <Text style={styles.loginText}>
                 Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
               </Text>
             </Pressable>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function LegalCheck({ label, checked, onPress }: any) {
  return (
    <Pressable style={styles.checkRow} onPress={onPress}>
       <View style={[styles.checkCircle, checked && styles.checkCircleActive]}>
          {checked && <Check size={14} color={DESIGN_COLORS.deepBlue} />}
       </View>
       <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_COLORS.deepBlue },
  flex: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  
  // Top Card Styles
  stackContainer: { marginTop: 40, position: 'relative', height: 260, alignItems: 'center' },
  bgCard: { position: 'absolute', width: '100%', height: 220, borderRadius: 32, backgroundColor: DESIGN_COLORS.white },
  primaryCard: { 
    width: '100%', 
    height: 220, 
    borderRadius: 32, 
    backgroundColor: COLORS.black, // Sleek black to contrast with the primary blue background
    padding: 30,
    justifyContent: 'space-between',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5
  },
  headline: { fontSize: 30, fontWeight: '800', color: DESIGN_COLORS.white, lineHeight: 36, letterSpacing: -0.5 },
  heroLogoRow: { alignItems: 'flex-end' },
  
  // Info Card Styles
  infoContainer: { marginTop: 20, position: 'relative', height: 200, alignItems: 'center' },
  infoBgCard: { position: 'absolute', width: '90%', height: 180, borderRadius: 32, backgroundColor: DESIGN_COLORS.white },
  infoCard: { 
    width: '100%', 
    height: 180, 
    borderRadius: 32, 
    backgroundColor: DESIGN_COLORS.white,
    padding: 30,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  infoTitle: { fontSize: 28, fontWeight: '800', color: DESIGN_COLORS.deepBlue, lineHeight: 32, letterSpacing: -0.5 },
  infoDescription: { fontSize: 13, color: DESIGN_COLORS.gray600, marginTop: 15, lineHeight: 18, fontWeight: '500' },
  
  // Legal Section
  legalSection: { gap: 12, marginTop: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#FFFFFF60', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: DESIGN_COLORS.white, borderColor: DESIGN_COLORS.white },
  checkLabel: { fontSize: 13, color: DESIGN_COLORS.white, fontWeight: '600' },
  
  // Footer
  footer: { gap: 20 },
  continueButton: { 
    backgroundColor: DESIGN_COLORS.indigoDark, 
    height: 64, 
    borderRadius: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  continueDisabled: { opacity: 0.5 },
  continueText: { color: DESIGN_COLORS.white, fontSize: 18, fontWeight: '800' },
  loginLink: { alignItems: 'center', marginBottom: 10 },
  loginText: { color: DESIGN_COLORS.white, fontSize: 14, opacity: 0.8 },
  loginTextBold: { fontWeight: '800', opacity: 1 }
});
