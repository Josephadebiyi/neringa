import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Bell, Shield, CreditCard, HelpCircle, Eye, EyeOff, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import { COLORS } from '../../constants/theme';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Verification Status */}
        <Pressable style={styles.kycBanner} onPress={() => router.push('/kyc')}>
          <View style={styles.kycInfo}>
            <Shield size={24} color={user?.isVerified ? COLORS.accentLime : COLORS.primary} />
            <View>
              <Text style={styles.kycTitle}>Verification Status</Text>
              <Text style={styles.kycStatus}>{user?.isVerified ? 'Fully Verified' : 'Action Required: Verify Identity'}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.gray400} />
        </Pressable>

        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.menuGroup}>
          <SettingItem label="Edit Profile" icon={<User size={20} color={COLORS.gray500} />} onPress={() => router.push('/profile/edit-details')} />
          <SettingItem label="Payment Methods" icon={<CreditCard size={20} color={COLORS.gray500} />} onPress={() => router.push('/profile/payment-methods')} />
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.menuGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconLabel}>
              <Bell size={20} color={COLORS.gray600} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch 
              value={notifEnabled} 
              onValueChange={setNotifEnabled}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingIconLabel}>
              <Shield size={20} color={COLORS.gray600} />
              <Text style={styles.settingLabel}>Biometric Login</Text>
            </View>
            <Switch 
              value={biometricEnabled} 
              onValueChange={setBiometricEnabled}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.menuGroup}>
          <SettingItem label="Terms of Service" icon={<HelpCircle size={20} color={COLORS.gray600} />} onPress={() => router.push('/legal/terms')} />
          <SettingItem label="Privacy Policy" icon={<HelpCircle size={20} color={COLORS.gray600} />} onPress={() => router.push('/legal/privacy')} />
        </View>

        <Pressable style={styles.deleteAccount} onPress={() => setShowDeleteConfirm(true)}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>

        {showDeleteConfirm && (
          <View style={styles.modalOverlay}>
            <View style={styles.warningCard}>
              <View style={styles.warningIconBg}>
                <AlertTriangle size={36} color={COLORS.accentCoral} />
              </View>
              <Text style={styles.warningTitle}>Delete your account?</Text>
              <Text style={styles.warningDesc}>
                This action is permanent and cannot be undone. You will lose all your trips, ratings, and profile data.
              </Text>
              
              <View style={styles.warningActions}>
                <Pressable 
                  style={styles.cancelBtn} 
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelBtnText}>Keep Account</Text>
                </Pressable>
                
                <Pressable 
                  style={styles.confirmDeleteBtn} 
                  onPress={() => {
                    Alert.alert('Final Confirmation', 'Are you absolutely sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Accept and Delete', style: 'destructive', onPress: () => router.replace('/') }
                    ]);
                  }}
                >
                  <Text style={styles.confirmBtnText}>Accept and Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ label, icon, onPress }: any) {
  return (
    <Pressable style={({ pressed }) => [styles.settingItem, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.settingIconLabel}>
        {icon}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={COLORS.gray400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgOff,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  kycBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  kycInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  kycStatus: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray400,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  menuGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  settingIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  pressed: {
    backgroundColor: COLORS.bg,
  },
  deleteAccount: {
    marginTop: 10,
    padding: 20,
    alignItems: 'center',
  },
  deleteText: {
    color: COLORS.accentCoral,
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  warningCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  warningIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 12,
  },
  warningDesc: {
    fontSize: 15,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  warningActions: {
    width: '100%',
    gap: 12,
  },
  confirmDeleteBtn: {
    backgroundColor: COLORS.accentCoral,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },
  cancelBtnText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '700',
  },
});
