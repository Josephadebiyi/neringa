import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Receipt, ShieldQuestion, ArrowUpRight, Download } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';

const MOCK_HISTORY = [
  { id: '1', type: 'Payment', item: 'Nike Shoes Delivery', amount: '$45.00', date: 'Oct 25', status: 'Completed', ref: 'BGO-8392M' },
  { id: '2', type: 'Refund', item: 'iPhone Case Delivery (Cancelled)', amount: '$15.00', date: 'Oct 23', status: 'Refunded', ref: 'BGO-7193C' },
  { id: '3', type: 'Payment', item: 'Gaming Console', amount: '$120.00', date: 'Oct 20', status: 'In Escrow', ref: 'BGO-5521E' },
];

export default function PaymentsRefundsScreen() {
  const [history, setHistory] = useState(MOCK_HISTORY);

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
        <Text style={styles.headerTitle}>Payments & Refunds</Text>
        <TouchableOpacity style={styles.downloadBtn}>
           <Download size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.escrowBanner}>
           <ShieldQuestion size={24} color="#0D9488" />
           <View style={styles.escrowInfo}>
             <Text style={styles.escrowTitle}>Escrow Protection</Text>
             <Text style={styles.escrowDesc}>
               "In Escrow" means the funds are held securely. They will move to "Completed" once the package is delivered.
             </Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyState}>
             <Receipt size={40} color={COLORS.gray300} style={{ marginBottom: 16 }} />
             <Text style={styles.emptyStateTitle}>No transactions yet</Text>
             <Text style={styles.emptyStateSub}>Once you make a payment or receive a refund, it will appear here.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((tx, idx) => (
              <View key={tx.id} style={[styles.txItem, idx === history.length - 1 && styles.txItemLast]}>
                 <View style={styles.txIconContainer}>
                   {tx.type === 'Refund' ? (
                     <ArrowUpRight size={20} color="#059669" />
                   ) : (
                     <Receipt size={20} color={COLORS.primary} />
                   )}
                 </View>
                 <View style={styles.txInfo}>
                   <Text style={styles.txItemName}>{tx.item}</Text>
                   <Text style={styles.txMeta}>{tx.date} • Ref: {tx.ref}</Text>
                 </View>
                 <View style={styles.txRight}>
                   <Text style={[styles.txAmount, tx.type === 'Refund' && { color: '#059669' }]}>
                     {tx.type === 'Refund' ? '+' : ''}{tx.amount}
                   </Text>
                   <Text style={[
                     styles.txStatus, 
                     tx.status === 'Completed' && { color: COLORS.gray500 },
                     tx.status === 'Refunded' && { color: '#059669' },
                     tx.status === 'In Escrow' && { color: '#D97706' }
                   ]}>{tx.status}</Text>
                 </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1.5, borderBottomColor: COLORS.gray100 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  downloadBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 20 },
  
  content: { padding: 24 },
  
  escrowBanner: { flexDirection: 'row', gap: 16, backgroundColor: '#F0FDFA', padding: 20, borderRadius: 24, marginBottom: 40, borderWidth: 1.5, borderColor: '#CCFBF1' },
  escrowInfo: { flex: 1 },
  escrowTitle: { fontSize: 16, fontWeight: '800', color: '#0F766E', marginBottom: 6 },
  escrowDesc: { fontSize: 13, color: '#134E4A', lineHeight: 20, fontWeight: '600' },
  
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 16 },
  
  historyList: { backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.white, gap: 16 },
  txItemLast: { borderBottomWidth: 0 },
  txIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txItemName: { fontSize: 15, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  txMeta: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '900', color: COLORS.black, marginBottom: 4 },
  txStatus: { fontSize: 11, fontWeight: '800' },

  emptyState: { paddingVertical: 60, alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 24 },
  emptyStateTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 8 },
  emptyStateSub: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', maxWidth: '80%', lineHeight: 20 },
});
