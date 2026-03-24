import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: October 2023</Text>
        
        <Section title="1. Introduction & GDPR Compliance">
          Bago ("we", "us", or "our") is committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR). This policy explains how we collect, process, and protect your information.
        </Section>
        
        <Section title="2. Information We Collect">
          We collect personal data to provide and improve our services, including:
          • Identity Data: Full name, address, date of birth, and identity documentation (KYC).
          • Contact Data: Email address and phone number.
          • Financial Data: Payment card details (processed securely via Stripe).
          • Technical Data: IP address, device type, and app usage logs.
          • Transaction Data: Details of shipments, routes, and communications.
        </Section>

        <Section title="3. How We Use Your Data">
          We use your data only when permitted by law, primarily to:
          • Verify your identity for safety and security.
          • Facilitate shipment bookings and payments.
          • Communicate important service updates.
          • Prevent fraudulent or illegal activities.
          • Provide customer support.
        </Section>
        
        <Section title="4. Sharing Your Information">
          We do not sell your data. We share only necessary information with:
          • Service Providers: Stripe (payments), identity verification services, and email providers.
          • Legal Authorities: When required by law or to investigate fraud.
          • Other Users: Essential details (name, photo, route) are shared between Senders and Carriers to facilitate shipments.
        </Section>

        <Section title="5. Your Rights Under GDPR">
          You have the following rights regarding your personal data:
          • Right to Access: Request a copy of your data.
          • Right to Rectification: Correct inaccurate or incomplete data.
          • Right to Erasure: Request deletion of your data (subject to legal retention requirements).
          • Right to Restriction: Restrict the processing of your data.
          • Right to Data Portability: Receive your data in a structured format.
          • Right to Object: Object to marketing or profiling.
        </Section>

        <Section title="6. Data Security & Retention">
          We implement robust security measures to protect your data. We retain your information only as long as necessary to fulfill the purposes of this policy or as required by law (e.g., tax and anti-money laundering regulations).
        </Section>

        <Section title="7. Third-Party Links">
          Our app may contain links to third-party services. Bago is not responsible for their privacy practices.
        </Section>

        <Section title="8. Cookies & Tracking">
          We use essential cookies and tracking technologies to maintain your session and improve app performance. You can manage these settings within your device's preferences.
        </Section>

        <Section title="9. Changes to this Policy">
          We may update this policy periodically. We will notify you of any significant changes via email or app notification.
        </Section>

        <Section title="10. Contact Us">
          For any data protection inquiries, please contact our Data Protection Officer (DPO) at help@sendwithbago.com.
        </Section>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 8, backgroundColor: COLORS.bgSoft, borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black, marginLeft: 16 },
  content: { paddingHorizontal: 24, paddingTop: 24 },
  lastUpdated: { fontSize: 13, color: COLORS.gray500, fontWeight: '600', marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 12 },
  sectionText: { fontSize: 15, color: COLORS.gray600, lineHeight: 24, textAlign: 'justify', fontWeight: '500' },
});
