import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { backendomain } from '@/utils/backendDomain';

export function useKYCCheck() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<string>('loading');
  const [loading, setLoading] = useState(true);

  const checkKYCStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${backendomain.backendomain}/api/baggo/kyc/status`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setKycStatus(response.data.kycStatus);
      } else {
        setKycStatus('not_started');
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
      setKycStatus('not_started');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkKYCStatus();
  }, [checkKYCStatus]);

  const requireKYC = useCallback((action: string) => {
    if (kycStatus !== 'approved') {
      Alert.alert(
        'Verification Required',
        `You need to complete identity verification to ${action}. This helps keep our community safe.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Now', onPress: () => router.push('/kyc-verification') },
        ]
      );
      return false;
    }
    return true;
  }, [kycStatus, router]);

  const isVerified = kycStatus === 'approved';
  const isPending = kycStatus === 'pending';
  const isDeclined = kycStatus === 'declined';

  return {
    kycStatus,
    loading,
    isVerified,
    isPending,
    isDeclined,
    requireKYC,
    refreshStatus: checkKYCStatus,
  };
}
