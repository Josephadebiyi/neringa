import { View, Text, ScrollView, Pressable, Alert, StyleSheet, Switch, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, Bell, HelpCircle, FileText, LogOut, 
  ChevronRight, BadgeCheck, Plus, 
  Star, MapPin, CreditCard, Wallet, 
  RotateCcw, ThumbsUp, Camera, Moon, Lock,
  MessageSquare, Shield, Edit2
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'about' | 'account'>('about');
  const [darkMode, setDarkMode] = useState(false);

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
            // Second confirmation
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
      {/* Tab Switcher Header */}
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
        {activeTab === 'about' ? <AboutTab user={user} /> : <AccountTab darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} onCloseAccount={handleCloseAccount} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutTab({ user }: any) {
  return (
    <View style={styles.tabContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile/edit-image')}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarFull} />
            ) : (
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
            )}
          </TouchableOpacity>
          <Pressable style={styles.cameraBtn} onPress={() => router.push('/profile/edit-image')}>
            <Camera size={14} color={COLORS.white} />
          </Pressable>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>{user?.name || 'Joseph'}</Text>
          <View style={styles.verifiedBadge}>
            <BadgeCheck size={14} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.verifiedText}>Verified Traveler</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile/edit-details')}>
          <Edit2 size={20} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>

      <Pressable style={styles.actionItem} onPress={() => router.push('/profile/edit-details')}>
        <Text style={styles.actionLinkText}>Edit personal details</Text>
      </Pressable>

      {/* Verification Checks */}
      <Text style={styles.sectionHeader}>YOU HAVE A VERIFIED PROFILE</Text>
      <View style={styles.verificationList}>
        <VerificationItem label="Verified ID" checked />
        <TouchableOpacity onPress={() => router.push('/profile/change-email')}>
          <VerificationItem label={`Email: ${user?.email || 'taiwojos2@gmail.com'}`} checked />
        </TouchableOpacity>
        <VerificationItem label="Phone: +34627642011" checked />
      </View>

      {/* About you Content */}
      <Text style={styles.sectionHeader}>ABOUT YOU</Text>
      <View style={styles.aboutList}>
        <Pressable style={styles.listItem} onPress={() => router.push('/profile/edit-bio')}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={[styles.listItemText, { color: COLORS.primary }]}>Add a mini bio</Text>
        </Pressable>
        <ListItem icon={<MessageSquare size={20} color={COLORS.gray600} />} text="I'm chatty when I feel comfortable" />
        <ListItem icon={<RotateCcw size={20} color={COLORS.gray600} />} text="I'll jam depending on the mood" />
        <ListItem icon={<ThumbsUp size={20} color={COLORS.gray600} />} text="Highly rated by the Bago community" />
      </View>
    </View>
  );
}

function AccountTab({ darkMode, setDarkMode, onLogout, onCloseAccount }: any) {
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
      <BadgeCheck size={20} color={COLORS.accentLime} />
      <Text style={styles.verificationLabel}>{label}</Text>
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

function MenuItem({ label, icon, isLast, onPress }: any) {
  return (
    <Pressable style={[styles.menuItem, isLast && styles.menuItemLast]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={COLORS.gray300} />
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
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  actionItem: { marginBottom: 32 },
  actionLinkText: { fontSize: 15, color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 20, marginTop: 10 },
  verificationList: { gap: 16, marginBottom: 40 },
  verificationItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verificationLabel: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  aboutList: { gap: 24 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  listItemText: { fontSize: 15, color: COLORS.black, fontWeight: '600' },
  menuGroup: { marginBottom: 32, backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.white },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuItemLabel: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, paddingVertical: 20 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  closeAccountButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    marginTop: 20, 
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
    borderRadius: 16
  },
  closeAccountText: { fontSize: 13, fontWeight: '800', color: COLORS.error, letterSpacing: 1, textTransform: 'uppercase' },
});
