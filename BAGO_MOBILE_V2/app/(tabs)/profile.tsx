import { View, Text, ScrollView, Pressable, Alert, StyleSheet, Switch, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, Bell, HelpCircle, FileText, LogOut, 
  ChevronRight, BadgeCheck, Plus, 
  Star, MapPin, CreditCard, Wallet, 
  RotateCcw, ThumbsUp, Camera, Moon, Lock,
  MessageSquare, Shield, Edit2, X, Check
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, deleteAccount, updateCurrency } = useAuth();
  const [activeTab, setActiveTab] = useState<'about' | 'account'>('about');
  const [darkMode, setDarkMode] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'ZAR', name: 'SA Rand', symbol: 'R' },
  ];

  const handleCurrencySelect = async (code: string) => {
    setIsUpdating(true);
    try {
      await updateCurrency(code);
      setShowCurrencyModal(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update currency');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  const handleCloseAccount = () => {
    Alert.alert(
      '⚠️ Close Account Permanently',
      'This action cannot be undone. You will lose all your trips, shipment history, and wallet data forever. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Next', 
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'By clicking "Agree & Delete", your data will be immediately removed from our servers. You will be logged out and cannot recover this account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Agree & Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      Alert.alert('We are sad to let you go', 'Your account has been deleted. We hope to see you again soon!', [
                        { text: 'Goodbye', onPress: () => router.replace('/auth/signin') }
                      ]);
                    } catch (e) {
                      Alert.alert('Error', 'Failed to close account. Please contact support.');
                    }
                  }
                }
              ]
            );
          } 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.tabSwitcher}>
          <Pressable 
            onPress={() => setActiveTab('about')}
            style={[styles.tabButton, activeTab === 'about' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>About you</Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('account')}
            style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>Account</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'about' ? (
          <AboutTab user={user} />
        ) : (
          <AccountTab 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            onLogout={handleLogout} 
            onCloseAccount={handleCloseAccount} 
            onOpenCurrency={() => setShowCurrencyModal(true)}
            currentCurrency={user?.preferredCurrency || 'USD'}
          />
        )}
      </ScrollView>

      <Modal visible={showCurrencyModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={styles.modalClose}>
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: 400}}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity 
                  key={c.code} 
                  style={[styles.currencyItem, user?.preferredCurrency === c.code && styles.currencyItemActive]}
                  onPress={() => handleCurrencySelect(c.code)}
                  disabled={isUpdating}
                >
                  <View style={styles.currencyIcon}>
                     <Text style={styles.currencySymbol}>{c.symbol}</Text>
                  </View>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyName}>{c.name}</Text>
                    <Text style={styles.currencyCode}>{c.code}</Text>
                  </View>
                  {user?.preferredCurrency === c.code && <Check size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AboutTab({ user }: any) {
  const kycStatus = user?.kycStatus || 'not_started';
  const isVerified = kycStatus === 'approved';
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile/edit-image')}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarFull} />
            ) : (
              <Text style={styles.avatarInitial}>{user?.firstName?.charAt(0) || 'U'}</Text>
            )}
          </TouchableOpacity>
          <Pressable style={styles.cameraBtn} onPress={() => router.push('/profile/edit-image')}>
            <Camera size={14} color={COLORS.white} />
          </Pressable>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Bago User'}</Text>
          <Pressable 
            onPress={() => router.push('/kyc')}
            style={[
              styles.verifiedBadge, 
              isVerified ? styles.badgeApproved : kycStatus === 'pending' ? styles.badgePending : styles.badgeNone
            ]}
          >
            <BadgeCheck size={14} color={isVerified ? COLORS.primary : COLORS.gray400} strokeWidth={2.5} />
            <Text style={[styles.verifiedText, { color: isVerified ? COLORS.primary : COLORS.gray500 }]}>
              {isVerified ? 'Verified Member' : kycStatus === 'pending' ? 'Verification Pending' : 'Identity Not Verified'}
            </Text>
          </Pressable>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile/edit-details')}>
          <Edit2 size={20} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>

      <Pressable style={styles.actionItem} onPress={() => router.push('/profile/edit-details')}>
        <Text style={styles.actionLinkText}>Edit personal details</Text>
      </Pressable>

      <Text style={styles.sectionHeader}>VERIFICATION STATUS</Text>
      <View style={styles.verificationList}>
        <VerificationItem label="Identity Verification" checked={isVerified} />
        <TouchableOpacity onPress={() => router.push('/profile/change-email')}>
          <VerificationItem label={`Email: ${user?.email || ''}`} checked={true} />
        </TouchableOpacity>
        <VerificationItem label={`Phone: ${user?.phone || 'Not set'}`} checked={!!user?.phone} />
      </View>

      <Text style={styles.sectionHeader}>ABOUT YOU</Text>
      <View style={styles.aboutList}>
        <Pressable style={styles.listItem} onPress={() => router.push('/profile/edit-bio')}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={[styles.listItemText, { color: COLORS.primary }]}>Add a mini bio</Text>
        </Pressable>
        <ListItem icon={<MessageSquare size={20} color={COLORS.gray600} />} text="Highly responsive and reliable" />
        <ListItem icon={<ThumbsUp size={20} color={COLORS.gray600} />} text="Highly rated by the Bago community" />
      </View>
    </View>
  );
}

function AccountTab({ darkMode, setDarkMode, onLogout, onCloseAccount, onOpenCurrency, currentCurrency }: any) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionHeader}>RATINGS & ACTIVITY</Text>
      <View style={styles.menuGroup}>
        <MenuItem label="Ratings you've left" icon={<Star size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/ratings')} />
        <MenuItem label="Saved routes" icon={<MapPin size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/saved-routes')} />
      </View>

      <Text style={styles.sectionHeader}>PAYMENTS & PAYOUTS</Text>
      <View style={styles.menuGroup}>
        <MenuItem label="Payout methods" icon={<Wallet size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/payout-methods')} />
        <MenuItem label="Payment methods" icon={<CreditCard size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/payment-methods')} />
        <MenuItem label="Payments & refunds" icon={<RotateCcw size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/payments-refunds')} />
      </View>

      <Text style={styles.sectionHeader}>PREFERENCES</Text>
      <View style={styles.menuGroup}>
        <MenuItem label="Primary Currency" icon={<Wallet size={20} color={COLORS.primary} />} rightText={currentCurrency} onPress={onOpenCurrency} />
        <MenuItem label="Communication preferences" icon={<Bell size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/communication-prefs')} />
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Moon size={20} color={COLORS.gray600} />
            <Text style={styles.menuItemLabel}>Dark mode</Text>
          </View>
          <Switch 
            value={darkMode} 
            onValueChange={setDarkMode} 
            trackColor={{ false: COLORS.gray200, true: COLORS.primaryLight }}
            thumbColor={darkMode ? COLORS.primary : COLORS.white}
          />
        </View>
      </View>

      <Text style={styles.sectionHeader}>SUPPORT & LEGAL</Text>
      <View style={styles.menuGroup}>
        <MenuItem label="Help & Support" icon={<HelpCircle size={20} color={COLORS.gray600} />} onPress={() => router.push('/profile/support')} />
        <MenuItem label="Terms & Conditions" icon={<FileText size={20} color={COLORS.gray600} />} onPress={() => router.push('/legal/terms')} />
        <MenuItem label="Privacy Policy" icon={<Shield size={20} color={COLORS.gray600} />} isLast onPress={() => router.push('/legal/privacy')} />
      </View>

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <LogOut size={20} color={COLORS.primary} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <TouchableOpacity style={styles.closeAccountButton} onPress={onCloseAccount}>
        <Shield size={18} color={COLORS.error} />
        <Text style={styles.closeAccountText}>Close Account</Text>
      </TouchableOpacity>
    </View>
  );
}

function VerificationItem({ label, checked }: any) {
  return (
    <View style={styles.verificationItem}>
      <BadgeCheck size={20} color={checked ? COLORS.primary : COLORS.gray300} />
      <Text style={[styles.verificationLabel, !checked && { color: COLORS.gray400 }]}>{label}</Text>
    </View>
  );
}

function ListItem({ icon, text }: any) {
  return (
    <View style={styles.listItem}>
      {icon}
      <Text style={styles.listItemText}>{text}</Text>
    </View>
  );
}

function MenuItem({ label, icon, isLast, onPress, rightText }: any) {
  return (
    <Pressable style={[styles.menuItem, isLast && styles.menuItemLast]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
        {rightText && <Text style={{fontSize: 14, fontWeight: '700', color: COLORS.primary}}>{rightText}</Text>}
        <ChevronRight size={18} color={COLORS.gray300} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tabSwitcher: { flexDirection: 'row', height: 60 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: '700', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.primary },
  scrollContent: { paddingBottom: 24 },
  tabContent: { padding: 24 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primarySoft, overflow: 'hidden' },
  avatarFull: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  profileInfo: { flex: 1 },
  nameText: { fontSize: 24, fontWeight: '800', color: COLORS.black },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeApproved: { backgroundColor: COLORS.primarySoft },
  badgePending: { backgroundColor: '#FFF7ED' },
  badgeNone: { backgroundColor: '#F3F4F6' },
  verifiedText: { fontSize: 12, fontWeight: '700' },
  actionItem: { marginBottom: 32 },
  actionLinkText: { fontSize: 15, color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1.2, marginBottom: 16, marginTop: 10, textTransform: 'uppercase' },
  verificationList: { gap: 16, marginBottom: 40 },
  verificationItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verificationLabel: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  aboutList: { gap: 24 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  listItemText: { fontSize: 15, color: COLORS.black, fontWeight: '600' },
  menuGroup: { marginBottom: 32, backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.white },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuItemLabel: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, paddingVertical: 20 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  closeAccountButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, 
    marginTop: 20, padding: 16, borderWidth: 1, borderColor: COLORS.error + '20', borderRadius: 16
  },
  closeAccountText: { fontSize: 13, fontWeight: '800', color: COLORS.error, letterSpacing: 1, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  modalClose: { padding: 4 },
  currencyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  currencyItemActive: { backgroundColor: COLORS.primarySoft + '40' },
  currencyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  currencySymbol: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  currencyInfo: { flex: 1 },
  currencyName: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  currencyCode: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },
});
