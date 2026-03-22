import { View, Pressable, StyleSheet, Image, Dimensions, Animated, ScrollView, Switch, TouchableOpacity, PanResponder } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  Package, Truck, Bell, MapPin, 
  Camera, CheckCircle, ChevronRight, 
  ArrowRight, ShieldCheck, X
} from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../constants/theme';

import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [checkingPersistence, setCheckingPersistence] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (Platform.OS === 'web') {
        setHasSeenOnboarding(false);
        setCheckingPersistence(false);
        return;
      }

      try {
        const hasSeen = await SecureStore.getItemAsync('has_seen_onboarding');
        const seen = hasSeen === 'true';
        setHasSeenOnboarding(seen);
        
        if (seen && !isAuthenticated) {
          router.replace('/auth/signin');
        }
      } catch (e) {
        setHasSeenOnboarding(false);
      } finally {
        setCheckingPersistence(false);
      }
    }

    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        checkOnboardingStatus();
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleFinishOnboarding = async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('has_seen_onboarding', 'true');
    }
    router.replace('/auth/signin');
  };

  if (isLoading || checkingPersistence || isAuthenticated || hasSeenOnboarding === true) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['bottom', 'top']}>
        <PermissionsScreen onFinish={handleFinishOnboarding} />
      </SafeAreaView>
    </View>
  );
}

function SplashScreen() {
  return (
    <View style={[styles.container, styles.splashBg]}>
      <StatusBar style="light" />
      <View style={styles.splashContent}>
        <Image 
          source={require('../assets/bago-logo-white.png')} 
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTagline}>Shipping made simple</Text>
      </View>
      <View style={styles.loaderContainer}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}



function PermissionsScreen({ onFinish }: any) {
  const [notifs, setNotifs] = useState(true);
  const [location, setLocation] = useState(true);
  const [camera, setCamera] = useState(true);

  return (
    <View style={styles.onboardingStep}>
      <View style={styles.flex}>
        <Text style={styles.stepHeader}>Enable notifications &{'\n'}permissions</Text>
        
        <View style={styles.permissionList}>
          <PermissionItem 
            icon={<Bell size={24} color={COLORS.primary} />} 
            bg={COLORS.primarySoft}
            title="Push Notifications"
            desc="Get updates on your shipments"
            value={notifs}
            onToggle={setNotifs}
          />
          <PermissionItem 
            icon={<MapPin size={24} color={COLORS.accentTeal} />} 
            bg="#CCFBF1"
            title="Location"
            desc="Track deliveries in real-time"
            value={location}
            onToggle={setLocation}
          />
          <PermissionItem 
            icon={<Camera size={24} color={COLORS.accentCoral} />} 
            bg="#FECDD3"
            title="Camera"
            desc="Verify package condition"
            value={camera}
            onToggle={setCamera}
          />
        </View>
      </View>

      <View style={styles.slideContainer}>
        <SliderButton onComplete={onFinish} />
      </View>
    </View>
  );
}

function SliderButton({ onComplete }: { onComplete: () => void }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const SLIDE_WIDTH = width - 48; // Total width minus padding
  const THUMB_SIZE = 56;
  const MAX_TRANSLATE = SLIDE_WIDTH - THUMB_SIZE - 8; // 8 for margins

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > MAX_TRANSLATE * 0.8) {
          // Success! Slide to end and complete
          Animated.timing(pan, {
            toValue: { x: MAX_TRANSLATE, y: 0 },
            duration: 100,
            useNativeDriver: false,
          }).start(() => {
            onComplete();
          });
        } else {
          // Reset
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Constrain X position
  const translateX = pan.x.interpolate({
    inputRange: [0, MAX_TRANSLATE],
    outputRange: [0, MAX_TRANSLATE],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.slideBtn}>
      <Text style={styles.slideText}>Slide to get started</Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.slideThumb,
          {
            transform: [{ translateX: translateX }],
          },
        ]}
      >
        <ArrowRight size={24} color={COLORS.primary} />
      </Animated.View>
    </View>
  );
}

function PermissionItem({ icon, bg, title, desc, value, onToggle }: any) {
  return (
    <View style={styles.permissionItem}>
      <View style={[styles.permIconBg, { backgroundColor: bg }]}>
        {icon}
      </View>
      <View style={styles.permText}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permDesc}>{desc}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : '#F4F3F4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  splashBg: { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  splashContent: { alignItems: 'center' },
  splashLogo: { width: 140, height: 140 },
  splashTagline: { fontSize: 16, color: COLORS.white, opacity: 0.8, marginTop: 16 },
  loaderContainer: { position: 'absolute', bottom: 100, flexDirection: 'row', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white, opacity: 0.3 },
  dotActive: { opacity: 1, transform: [{ scale: 1.2 }] },
  
  onboardingStep: { flex: 1, padding: 24, justifyContent: 'space-between' },
  welcomeHero: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 40, marginTop: 20, padding: 24, overflow: 'hidden' },
  welcomeHeadline: { fontSize: 36, fontWeight: '800', color: COLORS.white, lineHeight: 42, position: 'absolute', top: 40, left: 24 },
  cardStack: { marginTop: 200, position: 'relative', height: 260 },
  stackCard: { position: 'absolute', left: 0, right: 0, height: 200, borderRadius: 24, backgroundColor: COLORS.primaryLight, padding: 24 },
  stackHeadline: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  stackBody: { fontSize: 14, color: COLORS.gray500, lineHeight: 22 },
  
  welcomeFooter: { paddingVertical: 20 },
  termsBox: { marginBottom: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { fontSize: 13, color: COLORS.gray400, fontWeight: '600' },
  
  ctaButton: { backgroundColor: COLORS.black, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  ctaDisabled: { opacity: 0.5 },
  ctaButtonText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  loginOption: { marginTop: 20, alignItems: 'center' },
  loginTextSub: { fontSize: 14, color: COLORS.gray500, fontWeight: '600' },
  loginTextPrimary: { color: COLORS.primary, fontWeight: '800' },
    stepHeader: { fontSize: 32, fontWeight: '800', color: COLORS.black, marginTop: 40, marginBottom: 40 },
  
  permissionList: { gap: 24 },
  permissionItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  permIconBg: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  permText: { flex: 1 },
  permTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  permDesc: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  
  slideContainer: { marginBottom: 20 },
  slideBtn: { backgroundColor: COLORS.gray100, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  slideText: { fontSize: 16, fontWeight: '700', color: COLORS.gray500 },
  slideThumb: { position: 'absolute', left: 4, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', elevation: 3 }
});
