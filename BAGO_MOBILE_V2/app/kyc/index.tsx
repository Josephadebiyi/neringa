import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';
import kycService from '../../lib/kyc';

export default function KYCScreen() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingResult, setCheckingResult] = useState(false);

  // If user is already approved, they shouldn't be here or should see success
  const isApproved = user?.kycStatus === 'approved';
  const hasActiveSession = !!(user as any)?.diditSessionId;

  useEffect(() => {
    // If we're pending, we might want to check for updates when the screen opens
    if (user?.kycStatus === 'pending' && (user as any)?.diditSessionId) {
       checkKycStatus();
    }
  }, []);

  const checkKycStatus = async () => {
    if (!(user as any)?.diditSessionId) return;
    setCheckingResult(true);
    try {
      const result = await kycService.fetchResult((user as any).diditSessionId);
      if (result.kycStatus === 'approved') {
        await refreshUser();
        Alert.alert('Success', 'Your identity has been verified successfully!');
      } else {
        // Still pending or other status
        console.log('KYC Status:', result.kycStatus);
      }
    } catch (e) {
      console.error('Failed to check KYC status:', e);
    } finally {
      setCheckingResult(false);
    }
  };

  const handleStartVerification = async () => {
    setLoading(true);
    try {
      const session = await kycService.createSession();
      if (session.sessionUrl) {
        // Update user state to reflect 'pending' and store session
        await refreshUser();
        
        // Open the Didit verification URL in external browser
        const supported = await Linking.canOpenURL(session.sessionUrl);
        if (supported) {
          await Linking.openURL(session.sessionUrl);
        } else {
          Alert.alert('Error', 'Cannot open verification link. Please try again or contact support.');
        }
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.message || 'Failed to start verification session');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeVerification = async () => {
    // If we already have a session URL, just open it
    const sessionUrl = (user as any)?.diditSessionUrl;
    if (sessionUrl) {
      const supported = await Linking.canOpenURL(sessionUrl);
      if (supported) {
        await Linking.openURL(sessionUrl);
        return;
      }
    }
    
    // Otherwise, try to create/fetch a new session to be safe
    handleStartVerification();
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
        {isApproved ? (
          <View style={styles.centerBox}>
            <View style={[styles.shieldIconBg, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 size={60} color={COLORS.success} />
            </View>
            <Text style={styles.title}>You're Verified!</Text>
            <Text style={styles.subtitle}>
               Thank you for verifying your identity. You have full access to all Bago features.
            </Text>
            <Pressable style={styles.primaryButton} onPress={handleBack}>
              <Text style={styles.buttonText}>Back to Profile</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.centerBox}>
            <View style={styles.shieldIconBg}>
              <ShieldCheck size={60} color={COLORS.primary} />
            </View>
            
            <Text style={styles.title}>
              {user?.kycStatus === 'pending' ? 'Verification in Progress' : 'Secure your account'}
            </Text>
            
            <Text style={styles.subtitle}>
              {user?.kycStatus === 'pending' 
                ? "We're currently processing your identity verification. This usually takes a few minutes."
                : "Verification helps us build a trusted community. It only takes about 2 minutes to complete."
              }
            </Text>

            {user?.kycStatus === 'pending' && (
               <View style={styles.pendingBox}>
                  <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 16 }} />
                  <Text style={styles.pendingText}>Waiting for confirmation...</Text>
                  
                  <Pressable 
                    style={styles.refreshBtn} 
                    onPress={checkKycStatus}
                    disabled={checkingResult}
                  >
                     <RefreshCcw size={18} color={COLORS.primary} />
                     <Text style={styles.refreshBtnText}>Check Update</Text>
                  </Pressable>
               </View>
            )}

            <View style={styles.stepsBox}>
               <KYCStep 
                 num={1} 
                 label="Identity Document" 
                 sub="Passport, ID card or Drivers License" 
                 done={user?.kycStatus === 'pending'}
               />
               <KYCStep 
                 num={2} 
                 label="Selfie Verification" 
                 sub="Quick 3D face scan for bio-security" 
                 done={user?.kycStatus === 'pending'}
               />
               <KYCStep 
                 num={3} 
                 label="Get Verified Badge" 
                 sub="Access higher limits and build traveler trust" 
                 done={isApproved}
               />
            </View>

            <View style={styles.diditCard}>
              <View style={styles.diditHeader}>
                <ShieldCheck size={18} color={COLORS.gray600} />
                <Text style={styles.diditLabel}>Secure Verification</Text>
              </View>
              <Text style={styles.diditDesc}>
                We use industry-standard biometric security for identity verification. Your data is encrypted and handled solely for verification purposes.
              </Text>
            </View>

            {user?.kycStatus === 'pending' ? (
              <Pressable 
                style={[styles.primaryButton, { backgroundColor: COLORS.bgSoft, borderWidth: 1, borderColor: COLORS.primary }]} 
                onPress={handleResumeVerification}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.primary} /> : (
                  <Text style={[styles.buttonText, { color: COLORS.primary }]}>Resume Verification</Text>
                )}
              </Pressable>
            ) : (
              <Pressable 
                style={styles.primaryButton} 
                onPress={handleStartVerification}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <Text style={styles.buttonText}>Start Verification</Text>
                )}
              </Pressable>
            )}
            
            {user?.kycStatus === 'declined' && (
              <View style={styles.errorBox}>
                 <AlertCircle size={18} color={COLORS.error} />
                 <Text style={styles.errorText}>Your previous verification attempt was declined. Please try again with clearer documents.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KYCStep({ num, label, sub, done }: any) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepNum, done && { backgroundColor: COLORS.success }]}>
        {done ? <CheckCircle2 size={16} color={COLORS.white} /> : <Text style={styles.stepNumText}>{num}</Text>}
      </View>
      <View>
        <Text style={[styles.stepLabel, done && { color: COLORS.gray400 }]}>{label}</Text>
        <Text style={styles.stepSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginLeft: 8 },
  content: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center' },
  centerBox: { width: '100%', alignItems: 'center', paddingTop: 20 },
  shieldIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.black, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.gray600, textAlign: 'center', marginTop: 12, lineHeight: 22, paddingHorizontal: 20, fontWeight: '500' },
  pendingBox: { backgroundColor: COLORS.bgSoft, padding: 24, borderRadius: 24, width: '100%', marginTop: 24, alignItems: 'center' },
  pendingText: { fontSize: 14, fontWeight: '700', color: COLORS.gray600, marginBottom: 16 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  refreshBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  stepsBox: { width: '100%', marginTop: 32, gap: 24 },
  stepRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: COLORS.white, fontWeight: '900' },
  stepLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  stepSub: { fontSize: 13, color: COLORS.gray400, marginTop: 2, fontWeight: '500' },
  diditCard: { width: '100%', backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 20, marginTop: 32, borderWidth: 1, borderColor: COLORS.gray100 },
  diditHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  diditLabel: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  diditDesc: { fontSize: 12, color: COLORS.gray500, lineHeight: 18, fontWeight: '500' },
  primaryButton: { backgroundColor: COLORS.black, width: '100%', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  errorBox: { flexDirection: 'row', gap: 8, marginTop: 20, paddingHorizontal: 16 },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error, fontWeight: '600', lineHeight: 18 },
});
