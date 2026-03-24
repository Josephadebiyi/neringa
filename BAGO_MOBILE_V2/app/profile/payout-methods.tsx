import { View, Text, Pressable, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Wallet, Plus, CheckCircle, Info, ChevronRight, Landmark, CreditCard, ShieldCheck } from 'lucide-react-native';
import { Image } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function PayoutMethodsScreen() {
  const { user } = useAuth();
  const { formatCurrency, currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  useEffect(() => {
    // We could still fetch data if needed for other parts, but balance is no longer shown here
  }, []);



  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const handleStripeConnect = async () => {
    if (!user?.id) return Alert.alert('Error', 'Please log in to link your account.');
    setLoading(true);
    try {
      const response = await api.post('/api/stripe/connect/onboard', {
        userId: user.id || (user as any)._id,
        email: user.email
      });
      if (response.data.success && response.data.url) {
        // Open the onboarding URL
        await Linking.openURL(response.data.url);
      } else {
        Alert.alert('Connect', response.data.message || 'Stripe onboarding failed.');
      }
    } catch (error: any) {
       console.error('Stripe error:', error.response?.data || error.message);
       Alert.alert('Error', 'Could not start onboarding. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const AFRICAN_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'RWF', 'EGP', 'MAD'];

  const isAfricanCurrency = user?.preferredCurrency && AFRICAN_CURRENCIES.includes(user.preferredCurrency);

  const handlePaystackPayout = () => {
    if (!isAfricanCurrency) {
      Alert.alert('Currency mismatch', 'Paystack payouts are only available for African currencies.');
      return;
    }
    Alert.alert('Paystack Payout', 'Link your local bank account to receive payouts via Paystack.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add Bank', onPress: () => router.push('/profile/add-bank') }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Payout Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>


        <Text style={styles.sectionTitle}>YOUR CONNECTED ACCOUNTS</Text>
        
        {payouts.length > 0 ? (
           payouts.map((item) => (
             <View key={item.id} style={styles.payoutCard}>
               <View style={styles.payoutIcon}>
                 <Landmark size={24} color={COLORS.primary} />
               </View>
               <View style={styles.payoutInfo}>
                 <Text style={styles.bankName}>{item.bankName}</Text>
                 <Text style={styles.accountText}>•••• {item.last4}</Text>
                 <View style={styles.statusRow}>
                   <Text style={[styles.statusTag, { color: COLORS.success }]}>Verified</Text>
                   {item.isPrimary && <Text style={styles.primaryTag}>Primary</Text>}
                 </View>
               </View>
               <CheckCircle size={20} color={COLORS.success} fill={COLORS.success + '20'} />
             </View>
           ))
        ) : (
          <View style={styles.emptyPayout}>
             <Text style={styles.emptyPayoutText}>No bank accounts connected yet.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => router.push('/profile/add-bank')}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add Direct Bank Account</Text>
        </TouchableOpacity>

        <View style={styles.gatewaySection}>
          <Text style={styles.sectionTitle}>PAYOUT GATEWAYS</Text>
          <View style={styles.gatewayGrid}>
            {!isAfricanCurrency && (
              <TouchableOpacity 
                style={styles.gatewayItem} 
                activeOpacity={0.8}
                onPress={handleStripeConnect}
                disabled={loading}
              >
                <View style={[styles.gatewayIconBg, { backgroundColor: '#F0F9FF' }]}>
                  <Image source={{ uri: 'https://cdn.brandfolder.io/5H442S3W/at/pge7x75p3jch3hxt62kqmj/Stripe_Logomark_-_Blue.png' }} style={styles.gatewayIcon} />
                </View>
                <View style={styles.gatewayText}>
                  <Text style={styles.gatewayLabel}>Stripe Connect</Text>
                  <Text style={styles.gatewayDesc}>International payouts in USD, EUR, etc.</Text>
                </View>
                {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <ChevronRight size={18} color={COLORS.gray300} />}
              </TouchableOpacity>
            )}
            
            {isAfricanCurrency && (
              <TouchableOpacity 
                style={styles.gatewayItem} 
                activeOpacity={0.8}
                onPress={handlePaystackPayout}
              >
                <View style={[styles.gatewayIconBg, { backgroundColor: '#F0FDF4' }]}>
                  <CreditCard size={20} color={COLORS.success} />
                </View>
                <View style={styles.gatewayText}>
                  <Text style={styles.gatewayLabel}>Paystack Payouts</Text>
                  <Text style={styles.gatewayDesc}>Payouts for NGN and African currencies</Text>
                </View>
                <ChevronRight size={18} color={COLORS.gray300} />
              </TouchableOpacity>
            )}
          </View>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.gray100 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.bgSoft, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 16, marginTop: 10, textTransform: 'uppercase' },
  payoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 20, marginBottom: 16, gap: 16, borderWidth: 1, borderColor: COLORS.gray100 },
  payoutIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  payoutInfo: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  accountText: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  statusTag: { fontSize: 12, fontWeight: '800' },
  primaryTag: { fontSize: 10, fontWeight: '800', color: COLORS.primary, backgroundColor: COLORS.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  emptyPayout: { paddingVertical: 20, alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 24, marginBottom: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.gray200 },
  emptyPayoutText: { color: COLORS.gray400, fontWeight: '600', fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderStyle: 'dashed', borderWidth: 1.5, borderColor: COLORS.primary + '30', borderRadius: 24, backgroundColor: COLORS.primarySoft + '10' },
  addBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  gatewaySection: { marginTop: 40 },
  gatewayGrid: { gap: 16, marginTop: 4 },
  gatewayItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, padding: 16, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: COLORS.gray100 },
  gatewayIconBg: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gatewayIcon: { width: 28, height: 28, resizeMode: 'contain' },
  gatewayText: { flex: 1 },
  gatewayLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  gatewayDesc: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  infoBox: { marginTop: 40, flexDirection: 'row', gap: 12, padding: 20, backgroundColor: COLORS.bgSoft, borderRadius: 24, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, color: COLORS.gray600, fontWeight: '600', lineHeight: 18 },
});
