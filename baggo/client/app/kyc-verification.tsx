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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function KYCVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const { user, isAuthenticated, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState('not_started');
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      if (!isAuthenticated) {
        setLoading(false);
        Alert.alert('Not Logged In', 'Please log in to verify your identity.');
        return;
      }

      // Use the API interceptor - token is automatically attached
      const response = await api.get('/api/baggo/kyc/status');
      
      if (response.data.success) {
        const status = response.data.kycStatus;
        console.log('KYC Status from backend:', status);
        
        // If already approved or declined from backend, use that directly
        if (status === 'approved') {
          setKycStatus('approved');
          setCanRetry(false);
          // Ensure AuthContext is updated
          await refreshUser();
          return;
        }
        
        if (status === 'declined') {
          setKycStatus('declined');
          setCanRetry(true);
          return;
        }
        
        // If status is pending, check the actual DIDIT session status
        if (status === 'pending' && response.data.sessionId) {
          try {
            const sessionResponse = await api.get(`/api/baggo/kyc/check-session/${response.data.sessionId}`);
            const sessionData = sessionResponse.data.session;
            const diditStatus = sessionData.status?.toLowerCase();
            
            console.log('DIDIT Session status:', diditStatus);
            
            // Map DIDIT session status to our status
            if (diditStatus === 'created' || diditStatus === 'started') {
              // Session was created but not completed - allow retry
              setKycStatus('not_started');
              setCanRetry(true);
            } else if (diditStatus === 'submitted' || diditStatus === 'processing' || diditStatus === 'pending') {
              // Actually under review
              setKycStatus('pending');
              setCanRetry(false);
            } else if (diditStatus === 'approved') {
              setKycStatus('approved');
              setCanRetry(false);
              // Refresh user data to get updated status in AuthContext
              await refreshUser();
              Alert.alert('Verified!', 'Your identity has been verified. You now have full access to all features.');
            } else if (diditStatus === 'declined') {
              setKycStatus('declined');
              setCanRetry(true);
              Alert.alert('Verification Failed', 'Your verification was declined. Please try again with valid documents.');
            } else {
              // Unknown status, show as pending
              setKycStatus('pending');
              setCanRetry(true);
            }
          } catch (sessionErr) {
            console.log('Could not check DIDIT session:', sessionErr);
            // If we can't check session, show current status
            setKycStatus(status);
            setCanRetry(true);
          }
        } else if (status === 'not_started' || !status) {
          setKycStatus('not_started');
          setCanRetry(true);
        } else {
          setKycStatus(status);
          setCanRetry(status === 'declined' || status === 'not_started');
        }
      } else {
        setKycStatus('not_started');
        setCanRetry(true);
      }
    } catch (err: any) {
      console.log('KYC status error:', err?.response?.data || err.message);
      
      // Handle auth errors
      if (err?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/auth/signin');
        return;
      }
      
      setKycStatus('not_started');
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    if (!isAuthenticated) {
      Alert.alert('Not Logged In', 'Please log in to verify your identity.');
      return;
    }
    
    setCreatingSession(true);
    try {
      // Use the API interceptor - Bearer token is automatically attached
      const response = await api.post('/api/baggo/kyc/create-session');

      if (response.data.success) {
        if (response.data.status === 'approved') {
          setKycStatus('approved');
          Alert.alert('Already Verified', 'Your identity has already been verified.');
          return;
        }
        
        // Use the session URL from DIDIT
        const verificationUrl = response.data.sessionUrl;
        setSessionUrl(verificationUrl);
        setShowWebView(true);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to start verification');
      }
    } catch (err: any) {
      console.log('KYC create session error:', err?.response?.data || err.message);
      
      // Handle specific error cases
      if (err?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to continue.');
        router.replace('/auth/signin');
        return;
      }
      
      const message = err?.response?.data?.message || 'Failed to start verification. Please try again.';
      Alert.alert('Verification Unavailable', message);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleWebViewNavigation = (navState: any) => {
    const url = navState.url.toLowerCase();
    
    // Check if verification is complete or submitted
    if (
      url.includes('callback') || 
      url.includes('success') || 
      url.includes('complete') ||
      url.includes('approved') ||
      url.includes('submitted') ||
      url.includes('finished')
    ) {
      setShowWebView(false);
      setKycStatus('pending');
      setCanRetry(false);
      
      // Check actual status after a short delay
      setTimeout(() => {
        checkKYCStatus();
      }, 2000);
      
      Alert.alert(
        'Verification Submitted', 
        'Your verification is being processed. This usually takes a few minutes. We\'ll update your status automatically.'
      );
    }
    
    // User cancelled or went back
    if (url.includes('cancel') || url.includes('abort') || url.includes('exit')) {
      setShowWebView(false);
      setKycStatus('not_started');
      setCanRetry(true);
      Alert.alert(
        'Verification Cancelled', 
        'You can restart the verification process anytime.'
      );
    }
  };

  // Handle WebView close without completing
  const handleCloseWebView = () => {
    setShowWebView(false);
    // Keep current status but allow retry since they didn't complete
    setCanRetry(true);
    Alert.alert(
      'Verification Incomplete', 
      'You can continue the verification process anytime by tapping "Continue Verification".'
    );
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
        return <Shield size={80} color={'#5845D8'} />;
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
          color: '#1A1A1A',
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: '#F8F6F3' }]}>
        <ActivityIndicator size="large" color={'#5845D8'} />
      </SafeAreaView>
    );
  }

  // KycProcessing Screen - WebView for DIDIT verification
  if (showWebView && sessionUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
        <View style={[styles.header, { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E5E5' }]}>
          <TouchableOpacity onPress={handleCloseWebView} style={[styles.backButton, { backgroundColor: '#F8F6F3' }]}>
            <ChevronLeft size={24} color={'#1A1A1A'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#1A1A1A' }]}>Identity Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          ref={webViewRef}
          source={{ uri: sessionUrl }}
          style={styles.webview}
          onNavigationStateChange={handleWebViewNavigation}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.webviewLoading, { backgroundColor: '#F8F6F3' }]}>
              <ActivityIndicator size="large" color={'#5845D8'} />
              <Text style={[styles.loadingText, { color: '#6B6B6B' }]}>Loading verification...</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <View style={[styles.header, { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E5E5' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: '#F8F6F3' }]}>
          <ChevronLeft size={24} color={'#1A1A1A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#1A1A1A' }]}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: '#FFFFFF' }]}>
          {renderStatusIcon()}
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>{statusInfo.title}</Text>
          <Text style={[styles.statusSubtitle, { color: '#6B6B6B' }]}>{statusInfo.subtitle}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: '#1A1A1A' }]}>Why Verify?</Text>
          <View style={[styles.infoCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: `${'#5845D8'}15` }]}>
                <Shield size={20} color={'#5845D8'} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: '#1A1A1A' }]}>Security</Text>
                <Text style={[styles.infoItemDesc, { color: '#6B6B6B' }]}>Protect yourself and others from fraud</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: `${'#5845D8'}15` }]}>
                <CheckCircle size={20} color={'#5845D8'} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: '#1A1A1A' }]}>Full Access</Text>
                <Text style={[styles.infoItemDesc, { color: '#6B6B6B' }]}>Send packages and create trips</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons based on status */}
        {(kycStatus === 'not_started' || kycStatus === 'declined') && (
          <TouchableOpacity 
            style={[styles.verifyButton, { backgroundColor: '#5845D8' }]} 
            onPress={startVerification}
            disabled={creatingSession}
          >
            {creatingSession ? (
              <ActivityIndicator color={'#FFFFFF'} />
            ) : (
              <Text style={[styles.verifyButtonText, { color: '#FFFFFF' }]}>
                {kycStatus === 'declined' ? 'Try Again' : canRetry ? 'Continue Verification' : 'Start Verification'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {kycStatus === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.verifyButton, styles.refreshButton, { backgroundColor: '#FFFFFF', borderColor: '#5845D8' }]} 
              onPress={checkKYCStatus}
            >
              <Text style={[styles.refreshButtonText, { color: '#5845D8' }]}>Refresh Status</Text>
            </TouchableOpacity>
            {canRetry && (
              <TouchableOpacity 
                style={[styles.verifyButton, { marginTop: 12, backgroundColor: '#5845D8' }]} 
                onPress={startVerification}
                disabled={creatingSession}
              >
                {creatingSession ? (
                  <ActivityIndicator color={'#FFFFFF'} />
                ) : (
                  <Text style={[styles.verifyButtonText, { color: '#FFFFFF' }]}>Restart Verification</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {kycStatus === 'approved' && (
          <TouchableOpacity 
            style={[styles.verifyButton, { backgroundColor: '#4CAF50' }]} 
            onPress={() => router.back()}
          >
            <Text style={[styles.verifyButtonText, { color: '#FFFFFF' }]}>Continue to App</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
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
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
  },
  content: { 
    flex: 1, 
    padding: 20,
  },
  statusCard: {
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
    textAlign: 'center', 
    lineHeight: 20,
  },
  infoSection: { 
    marginBottom: 24,
  },
  infoTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12,
  },
  infoCard: { 
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
    marginBottom: 2,
  },
  infoItemDesc: { 
    fontSize: 12, 
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  verifyButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
  },
  refreshButton: { 
    borderWidth: 1, 
  },
  refreshButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
  },
  successButton: { 
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
