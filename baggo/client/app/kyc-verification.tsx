import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';
import axios from 'axios';

// KYC Verification Function as per documentation
async function startKycVerification(userId: string) {
  try {
    const response = await axios.post(
      `${backendomain.backendomain}/api/baggo/kyc/create-session`,
      { userId },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      return { success: true, sessionUrl: response.data.sessionUrl, sessionId: response.data.sessionId };
    } else {
      throw new Error(response.data.message || 'Verification failed');
    }
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Verification failed');
  }
}

export default function KYCVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState('not_started');
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const response = await axios.get(`${backendomain.backendomain}/api/baggo/kyc/status`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setKycStatus(response.data.kycStatus);
        setUserId(response.data.userId);
      } else {
        setKycStatus('not_started');
      }
    } catch (err: any) {
      // Handle 401/404 gracefully - user not logged in
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        setKycStatus('not_started');
      } else {
        console.error('API Error:', err?.response?.data || err?.message);
        setKycStatus('not_started');
      }
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    setCreatingSession(true);
    try {
      const result = await startKycVerification(userId || '');
      
      if (result.success) {
        setSessionUrl(result.sessionUrl);
        // Navigate to KycProcessing screen (WebView)
        setShowWebView(true);
      }
    } catch (err: any) {
      // Display error message as per documentation
      Alert.alert('Error', err.message || 'Verification failed');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleWebViewNavigation = (navState: any) => {
    // Check if verification is complete
    if (
      navState.url.includes('callback') || 
      navState.url.includes('success') || 
      navState.url.includes('complete') ||
      navState.url.includes('approved')
    ) {
      setShowWebView(false);
      setKycStatus('pending');
      checkKYCStatus();
      Alert.alert(
        'Verification Submitted', 
        'Your verification is being processed. This usually takes a few minutes.'
      );
    }
  };

  const renderStatusIcon = () => {
    switch (kycStatus) {
      case 'approved':
        return <CheckCircle size={80} color="#22C55E" />;
      case 'pending':
        return <Clock size={80} color="#F59E0B" />;
      case 'declined':
        return <XCircle size={80} color="#EF4444" />;
      default:
        return <Shield size={80} color={Colors.primary} />;
    }
  };

  const renderStatusText = () => {
    switch (kycStatus) {
      case 'approved':
        return {
          title: 'Verified',
          subtitle: 'Your identity has been verified. You have full access to all features.',
          color: '#22C55E',
        };
      case 'pending':
        return {
          title: 'Under Review',
          subtitle: 'Your verification is being processed. This usually takes a few minutes.',
          color: '#F59E0B',
        };
      case 'declined':
        return {
          title: 'Verification Failed',
          subtitle: 'Your verification was declined. Please try again with valid documents.',
          color: '#EF4444',
        };
      default:
        return {
          title: 'Verify Your Identity',
          subtitle: 'Complete KYC verification to send packages and create trips.',
          color: Colors.text,
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // KycProcessing Screen - WebView for DIDIT verification
  if (showWebView && sessionUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          ref={webViewRef}
          source={{ uri: sessionUrl }}
          style={styles.webview}
          onNavigationStateChange={handleWebViewNavigation}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading verification...</Text>
            </View>
          )}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
        />
      </SafeAreaView>
    );
  }

  const statusInfo = renderStatusText();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          {renderStatusIcon()}
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Verify?</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Shield size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoItemTitle}>Security</Text>
                <Text style={styles.infoItemDesc}>Protect yourself and others from fraud</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <CheckCircle size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoItemTitle}>Full Access</Text>
                <Text style={styles.infoItemDesc}>Send packages and create trips</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons based on status */}
        {(kycStatus === 'not_started' || kycStatus === 'declined') && (
          <TouchableOpacity 
            style={styles.verifyButton} 
            onPress={startVerification}
            disabled={creatingSession}
          >
            {creatingSession ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.verifyButtonText}>
                {kycStatus === 'declined' ? 'Try Again' : 'Start Verification'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {kycStatus === 'pending' && (
          <TouchableOpacity 
            style={[styles.verifyButton, styles.refreshButton]} 
            onPress={checkKYCStatus}
          >
            <Text style={styles.refreshButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        )}

        {kycStatus === 'approved' && (
          <TouchableOpacity 
            style={[styles.verifyButton, styles.successButton]} 
            onPress={() => router.back()}
          >
            <Text style={styles.verifyButtonText}>Continue to App</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.text,
  },
  content: { 
    flex: 1, 
    padding: 20,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 8,
  },
  statusSubtitle: { 
    fontSize: 14, 
    color: Colors.textLight, 
    textAlign: 'center', 
    lineHeight: 20,
  },
  infoSection: { 
    marginBottom: 24,
  },
  infoTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.text, 
    marginBottom: 12,
  },
  infoCard: { 
    backgroundColor: Colors.white, 
    borderRadius: 16, 
    padding: 16,
  },
  infoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: { 
    flex: 1,
  },
  infoItemTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: Colors.text, 
    marginBottom: 2,
  },
  infoItemDesc: { 
    fontSize: 12, 
    color: Colors.textLight,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  verifyButtonText: { 
    color: Colors.white, 
    fontSize: 16, 
    fontWeight: '600',
  },
  refreshButton: { 
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.primary,
  },
  refreshButtonText: { 
    color: Colors.primary, 
    fontSize: 16, 
    fontWeight: '600',
  },
  successButton: { 
    backgroundColor: '#22C55E',
  },
  webview: { 
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
});
