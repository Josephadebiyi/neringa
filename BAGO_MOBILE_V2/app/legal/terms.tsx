import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: October 2023</Text>
        
        <Section title="1. Acceptance of Terms">
          By accessing or using the Bago platform ("Bago", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree, you must not use our services.
        </Section>
        
        <Section title="2. The Bago Platform">
          Bago is a marketplace connecting independent individuals (Senders) with travelers (Carriers). Bago itself does not transport packages. We provide the technology to facilitate these connections.
        </Section>

        <Section title="3. Carrier Requirements & Safety">
          As a Carrier, you represents and warrants that:
          • You are at least 18 years old.
          • You have the legal right to travel on the specified route.
          • You will personally inspect every package you carry.
          • You will not carry any item that is illegal, dangerous, or restricted by airline or customs regulations.
          • You will deliver the package to the agreed-upon recipient at the specified time.
        </Section>
        
        <Section title="4. Prohibited Items">
          Including but not limited to:
          • Illegal drugs, narcotics, and paraphernalia.
          • Weapons, ammunition, and explosives.
          • Flammable, corrosive, or radioactive materials.
          • Pornographic or offensive materials.
          • Counterfeit goods or stolen property.
          • Perishable items or live animals (unless explicitly permitted).
          Violation results in immediate account termination and reporting to legal authorities.
        </Section>

        <Section title="5. Payments, Fees & Escrow">
          All payments must occur within the Bago app. We utilize an escrow system to protect both parties. Funds are held by Bago and only released to the Carrier once delivery is confirmed by the Sender or Receiver. Bago retains a service fee for facilitating the secure transaction.
        </Section>

        <Section title="6. Insurance & Protection">
          Bago provides a standard protection plan for items declared and insured through our platform. However, Bago's liability is limited to the insured value specified at the time of shipment. Carriers are encouraged to take photos of items at pickup and drop-off to verify condition.
        </Section>

        <Section title="7. Indemnification & Liability">
          You agree to indemnify, defend, and hold harmless Bago and its officers, directors, and employees from any claims, damages, or losses resulting from your breach of these terms, your transportation of packages, or your interaction with other users. Bago is not liable for any indirect, incidental, or consequential damages.
        </Section>

        <Section title="8. Account & KYC Verification">
          To ensure community safety, all users must complete Identity Verification (KYC). Providing false information is a breach of these terms. Only one account per person is permitted.
        </Section>

        <Section title="9. Termination">
          Bago reserves the right to suspend or terminate any account at any time for violations of these terms, suspected fraud, or behavior deemed harmful to the community.
        </Section>

        <Section title="10. Governing Law">
          These terms are governed by the laws of the jurisdiction in which Bago is incorporated. Any disputes will be settled through binding arbitration.
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
