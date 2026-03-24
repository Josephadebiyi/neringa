import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, Plus, Activity } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';
import api from '../../lib/api';
import { useCurrency } from '../../hooks/useCurrency';

export default function EarningsScreen() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [balance, setBalance] = useState({ balance: 0.00, pending: 0, currency: 'USD' });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/bago/getWallet');
      const data = res.data;
      setBalance({
        balance: data.balance || 0,
        pending: 0,
        currency: user?.preferredCurrency || 'USD',
      });
      const history: any[] = (data.history || []).slice(0, 10);
      setTransactions(history);
    } catch (e) {
      console.error('Failed to fetch wallet data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.preferredCurrency]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    router.push('/profile/withdraw');
  };

  const renderTransaction = (tx: any) => {
    const isCredit = tx.type === 'payment' || tx.type === 'refund';
    return (
      <TouchableOpacity key={tx.id} style={styles.txItem}>
        <View style={[styles.txIcon, { backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2' }]}>
          {isCredit ? <ArrowDownLeft size={20} color={COLORS.success} /> : <ArrowUpRight size={20} color={COLORS.error} />}
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txLabel}>{tx.description || 'Service Payment'}</Text>
          <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.txAmount}>
          <Text style={[styles.txValue, { color: isCredit ? COLORS.success : COLORS.gray900 }]}>
            {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
          </Text>
          <Text style={styles.txStatus}>{tx.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Total Earnings</Text>
          <Text style={styles.headerTitle}>{formatCurrency(balance.balance)}</Text>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
           <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.flex} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: '#F1F5FF' }]}>
                 <Clock size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{formatCurrency(balance.pending)}</Text>
           </View>
           <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                 <Activity size={20} color="#F97316" />
              </View>
              <Text style={styles.statLabel}>Deliveries</Text>
              <Text style={styles.statValue}>{transactions.filter(t => t.type === 'payment' && t.status === 'completed').length}</Text>
           </View>
        </View>

        <View style={styles.mainActionBox}>
           <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Set Payout Method</Text>
              <Text style={styles.actionDesc}>Add a bank account or wallet to receive your earnings automatically.</Text>
           </View>
           <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Payout Methods', 'Payout method management will be available in the next update.')}>
              <Plus size={24} color={COLORS.white} />
           </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
           <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Activity</Text>
              <TouchableOpacity>
                 <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
           </View>

           {loading && !refreshing ? (
             <View style={styles.emptyState}>
                <Activity size={32} color={COLORS.primary} />
                <Text style={styles.emptySubtitle}>Loading transactions...</Text>
             </View>
           ) : transactions.length > 0 ? (
             <View style={styles.txList}>
                {transactions.map(renderTransaction)}
             </View>
           ) : (
             <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                   <Wallet size={40} color={COLORS.gray200} />
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>Your earning history and payouts will appear here once you complete a delivery.</Text>
             </View>
           )}
        </View>

        <View style={styles.legalBox}>
           <ShieldCheck size={18} color={COLORS.gray400} />
           <Text style={styles.legalText}>Earned funds are protected by Bago Escrow Policy. Payouts are usually processed within 24-48 hours after delivery confirmation.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100
  },
  headerSubtitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray500, letterSpacing: 0.5, marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '900', color: COLORS.black, letterSpacing: -1 },
  withdrawBtn: { backgroundColor: COLORS.black, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  withdrawBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  scrollContent: { padding: 24 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.gray100 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statLabel: { fontSize: 13, fontWeight: '800', color: COLORS.gray500, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  mainActionBox: { backgroundColor: COLORS.primary, borderRadius: 32, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 40, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  actionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', lineHeight: 18 },
  actionBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  historySection: { marginBottom: 32 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black },
  seeAllText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  txList: { gap: 16 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  txIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  txDate: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  txAmount: { alignItems: 'flex-end' },
  txValue: { fontSize: 16, fontWeight: '800' },
  txStatus: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: COLORS.gray400, marginTop: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.black, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray400, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40 },
  legalBox: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 20, alignItems: 'center' },
  legalText: { flex: 1, fontSize: 12, color: COLORS.gray600, fontWeight: '600', lineHeight: 18 },
});
