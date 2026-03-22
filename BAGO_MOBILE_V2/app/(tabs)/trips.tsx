import { View, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, Wallet, Briefcase, Clock, ArrowRight, TrendingUp, 
  Trash2, Edit2, ArrowLeft, ShieldCheck, Mail, CheckCircle, 
  ChevronRight, Camera, Image as ImageIcon, User,
  ArrowUpRight, MessageSquare, Package, X, Send, Check
} from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { useState, useEffect } from 'react';
import tripService from '../../lib/trips';

export default function TravelerDashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripService.getMyTrips();
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const [incomingRequests, setIncomingRequests] = useState([
    { id: 'R1', sender: 'John Doe', item: 'iPhone 15 Case', weight: '0.2kg', price: '$15', date: 'Oct 24', image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=200' },
    { id: 'R2', sender: 'Jane Smith', item: 'Nike Shoes', weight: '1.2kg', price: '$45', date: 'Oct 25', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200' },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Withdrawal Flow States
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalStep, setWithdrawalStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState('1240.50');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const resetWithdrawal = () => {
    setShowWithdrawalModal(false);
    setWithdrawalStep(1);
    setOtp('');
  };

  const handleActionRequest = (id: string, action: 'accept' | 'decline') => {
    if (action === 'accept') {
       Alert.alert('Request Accepted', 'Coordinate with the sender via chat.', [
          { text: 'Chat', onPress: () => router.push('/messages/1') }
       ]);
    }
    setIncomingRequests(incomingRequests.filter(r => r.id !== id));
    setSelectedRequest(null);
  };

  const handleWithdrawalInitiate = () => {
    if (parseFloat(withdrawAmount) <= 0) return Alert.alert('Error', 'Enter a valid amount');
    setIsSendingOtp(true);
    // Mock API
    setTimeout(() => {
      setIsSendingOtp(false);
      setWithdrawalStep(2);
      Alert.alert('Verification Code Sent', 'Check your email for your 6-digit withdrawal confirmation code.');
    }, 1500);
  };

  const handleVerifyWithdrawal = () => {
    if (otp.length < 4) return Alert.alert('Error', 'Enter a valid verification code');
    setWithdrawalStep(3);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await tripService.cancelTrip(id);
            setTrips(trips.filter(t => t.id !== id));
            Alert.alert('Deleted', 'Tournament trip has been removed successfully.');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete trip');
          }
      }}
    ]);
  };

  const handleAcceptRequest = (id: string) => {
    Alert.alert('Request Accepted', 'Coordinate with the sender via chat.', [
      { text: 'Chat', onPress: () => router.push('/messages/1') }
    ]);
    setIncomingRequests(incomingRequests.filter(r => r.id !== id));
  };

  const handleDeclineRequest = (id: string) => {
    setIncomingRequests(incomingRequests.filter(r => r.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carrier Hub</Text>
        <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/post-trip')}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.postBtnText}>Post Trip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Wallet Section */}
        <View style={styles.walletCard}>
           <View style={styles.walletHeader}>
             <Wallet size={24} color={COLORS.white} />
             <Text style={styles.walletLabel}>Carrier Wallet</Text>
           </View>
           <Text style={styles.walletBalance}>$1,240.50</Text>
           <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdrawalModal(true)}>
             <Text style={styles.withdrawLabel}>Withdraw Funds</Text>
             <ArrowUpRight size={16} color={COLORS.primary} />
           </TouchableOpacity>
        </View>

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Incoming Proposals</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{incomingRequests.length}</Text></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.requestsScroll}>
              {incomingRequests.map(req => (
                <TouchableOpacity key={req.id} style={styles.requestCard} onPress={() => setSelectedRequest(req)}>
                  <View style={styles.reqHeader}>
                    <Image source={{ uri: req.image }} style={styles.reqImg} />
                    <View style={styles.reqInfo}>
                      <Text style={styles.reqSender}>{req.sender}</Text>
                      <Text style={styles.reqItem} numberOfLines={1}>{req.item}</Text>
                    </View>
                    <Text style={styles.reqPrice}>{req.price}</Text>
                  </View>
                  <View style={styles.reqActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(req.id)}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleDeclineRequest(req.id)}>
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* My Trips */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>My active trips</Text>
        </View>

        {trips.map(trip => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripMain}>
              <View style={styles.tripInfo}>
                <Text style={styles.tripRoute}>{trip.from} → {trip.to}</Text>
                <View style={[styles.badge, trip.status === 'Active' ? styles.bgSuccess : styles.bgWarning]}>
                     <Text style={[styles.badgeText, trip.status === 'Active' ? styles.textSuccess : styles.textWarning]}>{trip.status}</Text>
                </View>
              </View>
              <Text style={styles.tripPrice}>${trip.price}<Text style={styles.perKg}>/kg</Text></Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.tripActions}>
               <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/post-trip', params: { editId: trip.id } })}>
                 <Edit2 size={18} color={COLORS.gray600} />
                 <Text style={styles.actionLabel}>Edit</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDelete(trip.id)}>
                 <Trash2 size={18} color="#FF3B30" />
                 <Text style={styles.actionLabelDanger}>Delete</Text>
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Proposal Details Modal */}
      <Modal visible={!!selectedRequest} animationType="slide">
        <SafeAreaView style={styles.flex}>
           <View style={styles.modalBackHeader}>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}><ArrowLeft size={24} color={COLORS.black} /></TouchableOpacity>
              <Text style={styles.modalBackTitle}>Proposal Details</Text>
              <View style={{ width: 24 }} />
           </View>

            {selectedRequest && (
              <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
                 {/* Multi-Image Slider for Proposals */}
                 <View style={styles.expandedImageContainer}>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                       {(selectedRequest.images || [selectedRequest.image]).map((img: string, i: number) => (
                          <Image key={i} source={{ uri: img }} style={styles.expandedReqImg} />
                       ))}
                    </ScrollView>
                    {(selectedRequest.images || []).length > 1 && (
                      <View style={styles.imageCounter}>
                         <Text style={styles.imageCounterText}>{(selectedRequest.images || []).length} Photos</Text>
                      </View>
                    )}
                 </View>
                 
                 <View style={styles.expandedReqBody}>
                    <View style={styles.expandedReqHeaderRow}>
                       <View style={styles.expandedReqBadge}>
                          <Text style={styles.expandedReqBadgeText}>NEW PROPOSAL</Text>
                       </View>
                       <View style={styles.escrowBadge}>
                          <ShieldCheck size={14} color="#059669" />
                          <Text style={styles.escrowBadgeText}>ESCROW PROTECTED</Text>
                       </View>
                    </View>
                    
                    <Text style={styles.expandedReqItemName}>{selectedRequest.item}</Text>
                    
                    <View style={styles.expandedReqInfoGrid}>
                       <View style={styles.infoCol}>
                          <Text style={styles.infoColLabel}>SENDER</Text>
                          <View style={styles.senderDeets}>
                             <View style={styles.miniAvatar}><User size={14} color={COLORS.gray400} /></View>
                             <Text style={styles.infoColVal}>{selectedRequest.sender}</Text>
                             <CheckCircle size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                          </View>
                       </View>
                       <View style={styles.infoCol}>
                          <Text style={styles.infoColLabel}>EXPECTED EARNING</Text>
                          <Text style={[styles.infoColVal, { color: COLORS.primary }]}>{selectedRequest.price}</Text>
                       </View>
                    </View>

                    <View style={styles.expandedReqMetaRow}>
                       <View style={styles.expandedMetaItem}>
                          <Briefcase size={16} color={COLORS.gray400} />
                          <Text style={styles.expandedMetaLabel}>{selectedRequest.weight}</Text>
                       </View>
                       <View style={styles.expandedMetaItem}>
                          <Clock size={16} color={COLORS.gray400} />
                          <Text style={styles.expandedMetaLabel}>Deliver by {selectedRequest.date}</Text>
                       </View>
                    </View>

                    <View style={styles.dividerLarge} />
                    
                    <Text style={styles.descTitle}>Shipment Description</Text>
                    <Text style={styles.descText}>
                       Sender is requesting to ship this {selectedRequest.item} using your trip from London to Lagos. 
                       The item has been declared as "{selectedRequest.item}" and belongs to the "{selectedRequest.category || 'General'}" category.
                       Please review all photos to ensure item size and contents match your carrying capacity.
                    </Text>

                    <View style={styles.itemSpecs}>
                       <View style={styles.specRow}><Text style={styles.specLabel}>Category</Text><Text style={styles.specVal}>{selectedRequest.category || 'Electronics'}</Text></View>
                       <View style={styles.specRow}><Text style={styles.specLabel}>Dimensions</Text><Text style={styles.specVal}>Standard Box</Text></View>
                       <View style={styles.specRow}><Text style={styles.specLabel}>Insurance</Text><Text style={styles.specVal}>Bago Care Protected</Text></View>
                    </View>

                    <View style={styles.stickyActions}>
                       <TouchableOpacity 
                         style={[styles.payoutCta, { backgroundColor: COLORS.black }]} 
                         onPress={() => handleActionRequest(selectedRequest.id, 'accept')}
                       >
                          <Text style={styles.payoutCtaText}>Accept Proposal</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         style={[styles.resendBtn, { marginTop: 12 }]} 
                         onPress={() => handleActionRequest(selectedRequest.id, 'decline')}
                       >
                          <Text style={[styles.resendText, { color: '#FF3B30' }]}>Decline Request</Text>
                       </TouchableOpacity>
                    </View>
                 </View>
                 <View style={{ height: 60 }} />
              </ScrollView>
            )}
        </SafeAreaView>
      </Modal>

      {/* MULTI-STEP WITHDRAWAL MODAL */}
      <Modal visible={showWithdrawalModal} animationType="slide">
        <SafeAreaView style={styles.flex}>
           <View style={styles.modalBackHeader}>
              <TouchableOpacity onPress={resetWithdrawal}><ArrowLeft size={24} color={COLORS.black} /></TouchableOpacity>
              <Text style={styles.modalBackTitle}>Withdraw Earnings</Text>
              <View style={{ width: 24 }} />
           </View>

           {withdrawalStep === 1 && (
             <View style={styles.modalBodyFix}>
                <View style={styles.payoutIconCircle}><Wallet size={48} color={COLORS.primary} /></View>
                <Text style={styles.payoutTitle}>How much to withdraw?</Text>
                <Text style={styles.payoutSub}>Maximum available: $1,240.50</Text>
                
                <View style={styles.amountInputRow}>
                   <Text style={styles.amountPrefix}>$</Text>
                   <TextInput 
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    autoFocus
                   />
                </View>

                <TouchableOpacity 
                  style={[styles.payoutCta, isSendingOtp && styles.disabledBtn]} 
                  onPress={handleWithdrawalInitiate}
                  disabled={isSendingOtp}
                >
                   <Text style={styles.payoutCtaText}>{isSendingOtp ? 'Sending code...' : 'Withdraw Funds'}</Text>
                </TouchableOpacity>
             </View>
           )}

           {withdrawalStep === 2 && (
             <View style={styles.modalBodyFix}>
                <View style={[styles.payoutIconCircle, { backgroundColor: COLORS.bgSoft }]}><Mail size={48} color={COLORS.primary} /></View>
                <Text style={styles.payoutTitle}>Check your email</Text>
                <Text style={styles.payoutSub}>We've sent a 6-digit confirmation code to confirm your withdrawal of <Text style={styles.bold}>${withdrawAmount}</Text>.</Text>
                
                <View style={styles.otpWidth}>
                   <TextInput 
                    style={styles.otpInputLayout}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="— — — — — —"
                    placeholderTextColor={COLORS.gray300}
                    value={otp}
                    onChangeText={setOtp}
                    autoFocus
                   />
                </View>

                <TouchableOpacity style={styles.payoutCta} onPress={handleVerifyWithdrawal}>
                   <Text style={styles.payoutCtaText}>Verify & Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resendBtn} onPress={handleWithdrawalInitiate}>
                   <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
             </View>
           )}

           {withdrawalStep === 3 && (
             <View style={styles.modalBodyFix}>
                <View style={[styles.payoutIconCircle, { backgroundColor: '#D1FAE5' }]}><ShieldCheck size={48} color="#059669" /></View>
                <Text style={styles.payoutTitle}>Withdrawal Confirmed!</Text>
                <Text style={styles.payoutSub}>Your request of <Text style={styles.bold}>${withdrawAmount}</Text> has been accepted and will hit your account in 24-48 hours.</Text>
                
                <TouchableOpacity style={styles.payoutCta} onPress={resetWithdrawal}>
                   <Text style={styles.payoutCtaText}>Great, thanks!</Text>
                </TouchableOpacity>
             </View>
           )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 24, paddingVertical: 16 
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black },
  postBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    backgroundColor: COLORS.primary, height: 40, paddingHorizontal: 16, borderRadius: 20 
  },
  postBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },

  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },
  walletCard: { backgroundColor: COLORS.primary, borderRadius: 28, padding: 28, marginBottom: 32 },
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  walletLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  walletBalance: { fontSize: 32, fontWeight: '800', color: COLORS.white, marginBottom: 24 },
  withdrawBtn: { 
    backgroundColor: COLORS.white, paddingHorizontal: 16, height: 44, borderRadius: 14, 
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' 
  },
  withdrawLabel: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  countBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },

  requestsScroll: { overflow: 'visible', paddingBottom: 10 },
  requestCard: { backgroundColor: COLORS.bgSoft, width: 280, borderRadius: 24, padding: 20, marginRight: 16, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  reqHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  reqImg: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white },
  reqInfo: { flex: 1 },
  reqSender: { fontSize: 12, color: COLORS.gray500, fontWeight: '700', marginBottom: 2 },
  reqItem: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  reqPrice: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  reqActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, height: 38, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  declineBtn: { flex: 1, height: 38, backgroundColor: COLORS.white, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.gray100 },
  declineBtnText: { color: COLORS.gray500, fontSize: 12, fontWeight: '800' },

  tripCard: { backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 20, marginBottom: 16 },
  tripMain: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
  tripInfo: { flex: 1 },
  tripRoute: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 6 },
  tripPrice: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  perKg: { fontSize: 12, color: COLORS.gray400 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  bgSuccess: { backgroundColor: '#D1FAE5' },
  bgWarning: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  textSuccess: { color: '#059669' },
  textWarning: { color: '#D97706' },
  divider: { height: 1, backgroundColor: COLORS.gray200, marginVertical: 4 },
  tripActions: { flexDirection: 'row', gap: 12, paddingTop: 12 },
  actionBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    flex: 1, backgroundColor: COLORS.white, paddingVertical: 12, 
    justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: COLORS.gray100
  },
  actionBtnDanger: { backgroundColor: '#FFF5F5', borderColor: '#FFE4E4' },
  actionLabel: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  actionLabelDanger: { fontSize: 14, fontWeight: '800', color: '#FF3B30' },
  
  modalBackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  modalBackTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  modalBodyFix: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  payoutIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  payoutTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginBottom: 8 },
  payoutSub: { fontSize: 15, color: COLORS.gray500, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  bold: { color: COLORS.black, fontWeight: '800' },

  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 40 },
  amountPrefix: { fontSize: 40, fontWeight: '800', color: COLORS.primary },
  amountInput: { fontSize: 48, fontWeight: '800', color: COLORS.black, minWidth: 100 },

  otpWidth: { width: '100%', marginBottom: 40 },
  otpInputLayout: { height: 64, backgroundColor: COLORS.bgOff, borderRadius: 20, textAlign: 'center', fontSize: 28, fontWeight: '800', letterSpacing: 8, color: COLORS.black },

  payoutCta: { width: '100%', height: 60, backgroundColor: COLORS.primary, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  payoutCtaText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  disabledBtn: { opacity: 0.5 },
  resendBtn: { marginTop: 24, alignItems: 'center' },
  resendText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  // Expanded Request Modal Styles
  expandedReqImg: { width: '100%', height: 300, backgroundColor: COLORS.bgSoft },
  expandedReqBody: { padding: 32 },
  expandedReqBadge: { backgroundColor: COLORS.primaryLighter, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 16 },
  expandedReqBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  expandedReqItemName: { fontSize: 32, fontWeight: '900', color: COLORS.black, marginBottom: 32 },
  expandedReqInfoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  infoCol: { flex: 1 },
  infoColLabel: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, marginBottom: 8 },
  infoColVal: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  expandedReqMetaRow: { flexDirection: 'row', gap: 24, marginBottom: 32 },
  expandedMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expandedMetaLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray600 },
  dividerLarge: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 32 },
  descTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 12 },
  descText: { fontSize: 15, color: COLORS.gray500, lineHeight: 24 },
  stickyActions: { marginTop: 40 },
  
  expandedImageContainer: { width: '100%', height: 300, backgroundColor: COLORS.bgSoft },
  imageCounter: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  imageCounterText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  expandedReqHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  escrowBadgeText: { color: '#059669', fontSize: 10, fontWeight: '900' },
  senderDeets: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  itemSpecs: { backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 20, marginTop: 32 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  specLabel: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },
  specVal: { fontSize: 13, color: COLORS.black, fontWeight: '800' },
});
