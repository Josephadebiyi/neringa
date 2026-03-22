import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Bell, Mail, Smartphone, Shield } from 'lucide-react-native';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';

export default function CommunicationPrefsScreen() {
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    promo: false,
    sms: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs({...prefs, [key]: !prefs[key]});

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
        <Text style={styles.sectionHeader}>NOTIFICATIONS SETTINGS</Text>
        <PrefItem 
          icon={<Smartphone size={24} color={COLORS.primary} />} 
          title="Push Notifications"
          desc="Shipment updates, trip requests & chat alerts"
          value={prefs.push}
          onToggle={() => toggle('push')}
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
        />

        <Text style={styles.sectionHeader}>MARKETING & NEWS</Text>
        <PrefItem 
          icon={<Bell size={24} color={COLORS.accentAmber} />} 
          title="Promotions & Tips"
          desc="Exclusive offers and tips to earn more or save"
          value={prefs.promo}
          onToggle={() => toggle('promo')}
          isLast={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PrefItem({ icon, title, desc, value, onToggle, disabled, isLast }: any) {
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
        disabled={disabled}
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
