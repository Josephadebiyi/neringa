import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={'#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: October 2, 2025</Text>

        <Text style={styles.intro}>
          This Privacy Policy describes how BAGGO collects, uses, and protects your personal
          information in compliance with the EU General Data Protection Regulation (GDPR) and
          other applicable data protection laws.
        </Text>

        <Text style={styles.sectionTitle}>1. Data Controller</Text>
        <Text style={styles.text}>
          BAGGO Services Ltd. is the data controller responsible for your personal data.{'\n\n'}
          Contact:{'\n'}
          Email: privacy@baggo.eu{'\n'}
          Address: 123 Innovation Street, Brussels, Belgium{'\n'}
          Data Protection Officer: dpo@baggo.eu
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.text}>
          2.1 Account Information:{'\n'}
          • Name, email address, phone number{'\n'}
          • Date of birth, address{'\n'}
          • Profile photo (optional){'\n\n'}
          2.2 Verification Data:{'\n'}
          • Government-issued ID documents{'\n'}
          • Proof of address{'\n'}
          • Selfie verification photos{'\n\n'}
          2.3 Transaction Data:{'\n'}
          • Package details and descriptions{'\n'}
          • Delivery addresses{'\n'}
          • Payment information (processed by secure third parties){'\n\n'}
          2.4 Usage Data:{'\n'}
          • Device information and IP address{'\n'}
          • Browser type and operating system{'\n'}
          • Pages visited and actions taken{'\n'}
          • Location data (with your consent)
        </Text>

        <Text style={styles.sectionTitle}>3. Legal Basis for Processing</Text>
        <Text style={styles.text}>
          We process your data based on:{'\n\n'}
          3.1 Contract Performance: To provide our services{'\n'}
          3.2 Legitimate Interests: For fraud prevention and service improvement{'\n'}
          3.3 Legal Obligations: To comply with EU laws and regulations{'\n'}
          3.4 Consent: For marketing communications and optional features
        </Text>

        <Text style={styles.sectionTitle}>4. How We Use Your Data</Text>
        <Text style={styles.text}>
          4.1 To create and manage your account{'\n'}
          4.2 To facilitate package delivery services{'\n'}
          4.3 To verify your identity (KYC compliance){'\n'}
          4.4 To process payments and prevent fraud{'\n'}
          4.5 To communicate service updates and notifications{'\n'}
          4.6 To improve our platform and user experience{'\n'}
          4.7 To comply with legal obligations
        </Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.text}>
          We share your data only when necessary:{'\n\n'}
          5.1 With Other Users: Limited information for transaction purposes{'\n'}
          5.2 Service Providers: Payment processors, hosting providers{'\n'}
          5.3 Legal Authorities: When required by law{'\n'}
          5.4 Business Transfers: In case of merger or acquisition{'\n\n'}
          We NEVER sell your personal data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>6. Data Security</Text>
        <Text style={styles.text}>
          6.1 We use industry-standard encryption (SSL/TLS){'\n'}
          6.2 Data is stored in secure, EU-based servers{'\n'}
          6.3 Access is restricted to authorized personnel only{'\n'}
          6.4 Regular security audits are conducted{'\n'}
          6.5 Two-factor authentication is available
        </Text>

        <Text style={styles.sectionTitle}>7. Your GDPR Rights</Text>
        <Text style={styles.text}>
          Under GDPR, you have the right to:{'\n\n'}
          7.1 Right to Access: Request copies of your personal data{'\n'}
          7.2 Right to Rectification: Correct inaccurate data{'\n'}
          7.3 Right to Erasure: Request deletion of your data{'\n'}
          7.4 Right to Restrict Processing: Limit how we use your data{'\n'}
          7.5 Right to Data Portability: Receive your data in a structured format{'\n'}
          7.6 Right to Object: Object to certain processing activities{'\n'}
          7.7 Right to Withdraw Consent: At any time{'\n'}
          7.8 Right to Lodge a Complaint: With your local data protection authority{'\n\n'}
          To exercise these rights, contact us at privacy@baggo.eu
        </Text>

        <Text style={styles.sectionTitle}>8. Data Retention</Text>
        <Text style={styles.text}>
          8.1 Account data: Retained while your account is active{'\n'}
          8.2 Transaction data: Retained for 7 years for accounting purposes{'\n'}
          8.3 KYC documents: Retained for 5 years per EU anti-money laundering laws{'\n'}
          8.4 Marketing data: Until you withdraw consent{'\n'}
          8.5 After deletion, data is anonymized or securely destroyed
        </Text>

        <Text style={styles.sectionTitle}>9. International Transfers</Text>
        <Text style={styles.text}>
          9.1 Your data is primarily stored in EU data centers{'\n'}
          9.2 Any transfers outside the EU use approved mechanisms:{'\n'}
          • Standard Contractual Clauses{'\n'}
          • Adequacy decisions{'\n'}
          • Appropriate safeguards per GDPR Article 46
        </Text>

        <Text style={styles.sectionTitle}>10. Cookies and Tracking</Text>
        <Text style={styles.text}>
          We use cookies for:{'\n\n'}
          10.1 Essential Cookies: Required for platform functionality{'\n'}
          10.2 Analytics Cookies: To understand usage patterns{'\n'}
          10.3 Preference Cookies: To remember your settings{'\n\n'}
          You can manage cookie preferences in your browser settings.
        </Text>

        <Text style={styles.sectionTitle}>11. Children's Privacy</Text>
        <Text style={styles.text}>
          11.1 Our services are not intended for users under 18{'\n'}
          11.2 We do not knowingly collect data from minors{'\n'}
          11.3 If we discover such data, it will be deleted promptly
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to This Policy</Text>
        <Text style={styles.text}>
          12.1 We may update this policy periodically{'\n'}
          12.2 You will be notified of significant changes{'\n'}
          12.3 Continued use constitutes acceptance of changes{'\n'}
          12.4 Previous versions are archived and available upon request
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Us</Text>
        <Text style={styles.text}>
          For privacy-related questions or to exercise your rights:{'\n\n'}
          Email: privacy@baggo.eu{'\n'}
          Data Protection Officer: dpo@baggo.eu{'\n'}
          Address: BAGGO Services Ltd., 123 Innovation Street, Brussels, Belgium{'\n'}
          Phone: +32 2 123 4567{'\n\n'}
          EU Data Protection Supervisory Authority:{'\n'}
          You can lodge a complaint with your local data protection authority or the Belgian
          Data Protection Authority (APD/GBA).
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#1A1A1A'Muted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 14,
    color: '#1A1A1A'Light,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#1A1A1A'Light,
    lineHeight: 24,
    marginBottom: 16,
  },
});
