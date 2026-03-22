import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, User, Smartphone, Lock, Camera, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { COLORS } from '../../constants/theme';

export default function KYCScreen() {
  const [status, setStatus] = useState<'start' | 'loading' | 'success'>('start');

  const handleDiditVerification = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 2500);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Identity Verification</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {status === 'start' && (
          <View style={styles.centerBox}>
            <View style={styles.shieldIconBg}>
              <ShieldCheck size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Secure your account</Text>
            <Text style={styles.subtitle}>
              Verification helps us build a trusted community of travelers and senders. It only takes 2 minutes.
            </Text>

            <View style={styles.stepsBox}>
              <KYCStep num={1} label="Identity Document" sub="Passport, ID card or Drivers License" />
              <KYCStep num={2} label="Face Scan" sub="Quick 3D face verification for security" />
              <KYCStep num={3} label="Verified Status" sub="Get your traveler badge and start earning" />
            </View>

            <View style={styles.diditCard}>
              <View style={styles.diditHeader}>
                <Image 
                  source={{ uri: 'https://didit.me/favicon.ico' }} // Placeholder for Didit icon
                  style={styles.diditIcon}
                />
                <Text style={styles.diditLabel}>Powered by Didit</Text>
              </View>
              <Text style={styles.diditDesc}>
                We use Didit for bank-level biometric security and identity verification.
              </Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleDiditVerification}>
              <Text style={styles.buttonText}>Verify with Didit</Text>
            </Pressable>
          </View>
        )}

        {status === 'loading' && (
          <View style={styles.centerBox}>
            <View style={styles.loadingBox}>
              {/* Simple spinner placeholder */}
              <View style={styles.spinner} />
            </View>
            <Text style={styles.title}>Verifying with Didit...</Text>
            <Text style={styles.subtitle}>Please do not close the app while we process your request.</Text>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.centerBox}>
            <View style={[styles.shieldIconBg, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 size={60} color={COLORS.accentLime} />
            </View>
            <Text style={styles.title}>Verification Successful!</Text>
            <Text style={styles.subtitle}>
              Your identity has been verified. You now have full access to all features on Bago.
            </Text>
            <Pressable style={styles.primaryButton} onPress={handleBack}>
              <Text style={styles.buttonText}>Back to Profile</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KYCStep({ num, label, sub }: any) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <View>
        <Text style={styles.stepLabel}>{label}</Text>
        <Text style={styles.stepSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  centerBox: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
  },
  shieldIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  stepsBox: {
    width: '100%',
    marginTop: 40,
    gap: 24,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  stepSub: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 2,
  },
  diditCard: {
    width: '100%',
    backgroundColor: COLORS.bgOff,
    borderRadius: 16,
    padding: 20,
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  diditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  diditIcon: {
    width: 16,
    height: 16,
  },
  diditLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  diditDesc: {
    fontSize: 12,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingBox: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    // In a real app we'd animate this
  },
});
