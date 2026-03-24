import { View, Text, FlatList, Pressable, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, CreditCard, Plus, CheckCircle, Trash2, ShieldCheck, Lock, X } from 'lucide-react-native';
import { Image } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useState } from 'react';

const MOCK_CARDS = [
  { id: '1', brand: 'Visa', last4: '4242', expiry: '08/26', primary: true },
  { id: '2', brand: 'Mastercard', last4: '8899', expiry: '12/25', primary: false },
];

export default function PaymentMethodsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [cards, setCards] = useState(MOCK_CARDS);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvc: '' });

  const handleAddCard = () => {
    if (newCard.number.length < 16) return Alert.alert('Invalid Card', 'Please enter a valid card number');
    const brand = newCard.number.startsWith('4') ? 'Visa' : 'Mastercard';
    const last4 = newCard.number.slice(-4);
    const addedCard = {
      id: Math.random().toString(),
      brand,
      last4,
      expiry: newCard.expiry,
      primary: false
    };
    setCards([...cards, addedCard]);
    setShowAddModal(false);
    setNewCard({ number: '', expiry: '', cvc: '' });
    Alert.alert('Success', 'Payment method added securely.');
  };

  const deleteCard = (id: string) => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to remove this payment method?');
      if (confirm) setCards(cards.filter(c => c.id !== id));
      return;
    }

    Alert.alert('Remove Card', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setCards(cards.filter(c => c.id !== id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment methods</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>YOUR SAVED CARDS</Text>
        {cards.map((item) => (
          <View key={item.id} style={styles.cardItem}>
            <View style={styles.cardIcon}>
              <CreditCard size={24} color={item.primary ? COLORS.primary : COLORS.gray400} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{item.brand} •••• {item.last4}</Text>
              <Text style={styles.cardSub}>Expires {item.expiry}</Text>
              {item.primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCard(item.id)}>
              <Trash2 size={18} color={COLORS.gray300} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add Payment Method</Text>
        </TouchableOpacity>

        <View style={styles.escrowBanner}>
          <ShieldCheck size={24} color="#0D9488" />
          <View style={styles.escrowInfo}>
            <Text style={styles.escrowTitle}>Bago Escrow Protected</Text>
            <Text style={styles.escrowDesc}>
              Payments are held securely and only released to the carrier after successful delivery confirmation.
            </Text>
          </View>
        </View>

        <View style={styles.securityBox}>
          <Lock size={28} color={COLORS.gray400} />
          <Text style={styles.securityTitle}>Bank-level Security</Text>
          <Text style={styles.securityDesc}>
            Bago uses SSL encryption and trusted payment processors. Your data is 100% secure.
          </Text>
        </View>
      </ScrollView>

      {/* ADD CARD MODAL */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
           <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Add New Card</Text>
                 <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.black} /></TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Card Number</Text>
                 <TextInput 
                   style={styles.textInput} 
                   placeholder="0000 0000 0000 0000" 
                   keyboardType="numeric"
                   maxLength={16}
                   value={newCard.number}
                   onChangeText={(v) => setNewCard({...newCard, number: v})}
                 />
              </View>

              <View style={styles.row}>
                 <View style={[styles.flex, { marginRight: 12 }]}>
                    <Text style={styles.inputLabel}>Expiry</Text>
                    <TextInput 
                      style={styles.textInput} 
                      placeholder="MM/YY" 
                      maxLength={5}
                      value={newCard.expiry}
                      onChangeText={(v) => setNewCard({...newCard, expiry: v})}
                    />
                 </View>
                 <View style={styles.flex}>
                    <Text style={styles.inputLabel}>CVC</Text>
                    <TextInput 
                      style={styles.textInput} 
                      placeholder="***" 
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                      value={newCard.cvc}
                      onChangeText={(v) => setNewCard({...newCard, cvc: v})}
                    />
                 </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
                 <Text style={styles.saveBtnText}>Save Securely</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1.5, borderBottomColor: COLORS.gray100 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 16 },
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 20, marginBottom: 16, gap: 16 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  cardSub: { fontSize: 13, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  primaryBadge: { backgroundColor: COLORS.primarySoft, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 8 },
  primaryText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  deleteBtn: { padding: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 24, marginTop: 10 },
  addBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  
  securityBox: { marginTop: 40, padding: 32, backgroundColor: COLORS.bgSoft, borderRadius: 32, alignItems: 'center' },
  securityTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 8, marginTop: 12 },
  securityDesc: { fontSize: 13, color: COLORS.gray600, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  
  escrowBanner: { flexDirection: 'row', gap: 16, backgroundColor: '#F0FDFA', padding: 20, borderRadius: 24, marginTop: 40, borderWidth: 1.5, borderColor: '#CCFBF1' },
  escrowInfo: { flex: 1 },
  escrowTitle: { fontSize: 16, fontWeight: '800', color: '#0F766E', marginBottom: 4 },
  escrowDesc: { fontSize: 13, color: '#134E4A', lineHeight: 18, fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: COLORS.gray400, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: COLORS.bgSoft, borderRadius: 16, height: 60, paddingHorizontal: 20, fontSize: 16, color: COLORS.black, fontWeight: '700' },
  row: { flexDirection: 'row', marginBottom: 32 },
  saveBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
});
