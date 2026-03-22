import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ChevronLeft, CreditCard, ShieldCheck, Lock, 
  Plus, Check, ChevronRight, Wallet, BadgeCheck 
} from 'lucide-react-native';
import { useState } from 'react';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#5845D8',
  primaryLight: '#EDE9FE',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  gray900: '#111827',
  gray600: '#4B5563',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  green: '#10B981',
};

import { useCurrency } from '../../hooks/useCurrency';

export default function PaymentScreen() {
  const [selectedMethod, setSelectedMethod] = useState('card-1');
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useCurrency();

  const handlePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/order-success');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>Review & Pay</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>{formatCurrency(25.00)}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.itemText}>Shipping Fee</Text>
            <Text style={styles.priceText}>{formatCurrency(20.00)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.itemText}>Insurance & Service Fee</Text>
            <Text style={styles.priceText}>{formatCurrency(5.00)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <PaymentMethod 
          id="card-1"
          icon={<CreditCard size={24} color={COLORS.primary} />}
          label="Visa ending in 4242"
          expiry="08/26"
          selected={selectedMethod === 'card-1'}
          onSelect={() => setSelectedMethod('card-1')}
        />

        <PaymentMethod 
          id="card-2"
          icon={<CreditCard size={24} color={COLORS.gray400} />}
          label="Mastercard ending in 8899"
          expiry="12/25"
          selected={selectedMethod === 'card-2'}
          onSelect={() => setSelectedMethod('card-2')}
        />

        <Pressable style={styles.addMethod}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addMethodText}>Add New Payment Method</Text>
        </Pressable>

        {/* Security Badge */}
        <View style={styles.securityBox}>
          <View style={styles.securityTags}>
            <View style={styles.tag}>
              <Lock size={12} color={COLORS.gray600} />
              <Text style={styles.tagText}>SSL Encrypted</Text>
            </View>
            <View style={styles.tag}>
              <BadgeCheck size={12} color={COLORS.gray600} />
              <Text style={styles.tagText}>Verified by Bago</Text>
            </View>
          </View>
          <Text style={styles.securityDesc}>
            Your payment is secure. We use bank-level encryption to protect your data. Funds are held in escrow until delivery is confirmed.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>
            {loading ? 'Processing...' : 'Pay with Visa'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PaymentMethod({ id, icon, label, expiry, selected, onSelect }: any) {
  return (
    <Pressable 
      style={[styles.methodItem, selected && styles.methodSelected]} 
      onPress={onSelect}
    >
      <View style={styles.methodLeft}>
        <View style={[styles.iconBg, selected && styles.iconBgSelected]}>
          {icon}
        </View>
        <View>
          <Text style={styles.methodLabel}>{label}</Text>
          <Text style={styles.methodSub}>Expires {expiry}</Text>
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <Check size={14} color={COLORS.white} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray400,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.gray900,
    marginTop: 8,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.gray200,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  itemText: {
    fontSize: 15,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 15,
    color: COLORS.gray900,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 16,
    marginLeft: 4,
  },
  methodItem: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodSelected: {
    borderColor: COLORS.primary,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  methodSub: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  addMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginTop: 10,
  },
  addMethodText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  securityBox: {
    marginTop: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
  },
  securityTags: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  securityDesc: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  payButton: {
    backgroundColor: COLORS.gray900,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
