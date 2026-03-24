import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Mail, Smartphone, Shield } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { registerForPushNotificationsAsync } from '../../lib/notifications';
import * as Notifications from 'expo-notifications';

export default function CommunicationPrefsScreen() {
  const { user, updateUser } = useAuth();
  const [savingPush, setSavingPush] = useState(false);
  const [prefs, setPrefs] = useState({
    push: (user as any)?.communicationPrefs?.push ?? true,
    email: (user as any)?.communicationPrefs?.email ?? true,
    sms: (user as any)?.communicationPrefs?.sms ?? true,
  });

  // Sync push toggle with actual OS permission on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        setPrefs(p => ({ ...p, push: false }));
      }
    })();
  }, []);

  const handlePushToggle = async () => {
    if (savingPush) return;
    setSavingPush(true);
    try {
      if (!prefs.push) {
        // Turning ON — request permission and get token
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications for Bago in your device Settings to receive push notifications.',
            [{ text: 'OK' }]
          );
          setSavingPush(false);
          return;
        }
        const newPrefs = { ...prefs, push: true };
        setPrefs(newPrefs);
        await updateUser({ communicationPrefs: newPrefs, pushToken: token } as any);
      } else {
        // Turning OFF — clear token from backend
        const newPrefs = { ...prefs, push: false };
        setPrefs(newPrefs);
        await updateUser({ communicationPrefs: newPrefs, pushToken: null } as any);
      }
    } catch (e) {
      console.error('Push toggle error:', e);
      // Rollback
      setPrefs(p => ({ ...p, push: !p.push }));
    } finally {
      setSavingPush(false);
    }
  };

  const toggle = async (key: 'email' | 'sms') => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      await updateUser({ communicationPrefs: newPrefs } as any);
    } catch (e) {
      console.error('Update prefs error:', e);
      setPrefs(prefs);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Communication</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>NOTIFICATION SETTINGS</Text>

        <PrefItem
          icon={<Smartphone size={24} color={COLORS.primary} />}
          title="Push Notifications"
          desc="Shipment updates, trip requests & chat alerts"
          value={prefs.push}
          onToggle={handlePushToggle}
          loading={savingPush}
        />
        <PrefItem
          icon={<Mail size={24} color={COLORS.primary} />}
          title="Email Notifications"
          desc="Booking confirmations and account security"
          value={prefs.email}
          onToggle={() => toggle('email')}
        />
        <PrefItem
          icon={<Shield size={24} color={COLORS.primary} />}
          title="System Alerts"
          desc="Critical updates about the Bago service"
          value={true}
          disabled={true}
          isLast={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PrefItem({ icon, title, desc, value, onToggle, disabled, isLast, loading }: any) {
  return (
    <View style={[styles.prefItem, isLast && styles.prefItemLast]}>
      <View style={styles.prefIcon}>{icon}</View>
      <View style={styles.prefContent}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled || loading}
        trackColor={{ false: COLORS.gray200, true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : COLORS.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 20, marginTop: 10 },
  prefItem: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  prefItemLast: { marginBottom: 0 },
  prefIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  prefContent: { flex: 1 },
  prefTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  prefDesc: { fontSize: 13, color: COLORS.gray500, fontWeight: '600', marginTop: 4, lineHeight: 18 },
});
