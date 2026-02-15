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

export default function TermsConditionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: October 2, 2025</Text>

        <Text style={styles.intro}>
          These Terms and Conditions govern your use of BAGGO services. By accessing or using our
          platform, you agree to be bound by these terms.
        </Text>

        <Text style={styles.sectionTitle}>1. Definitions</Text>
        <Text style={styles.text}>
          1.1 "Platform" refers to the BAGGO website and mobile applications.{'\n'}
          1.2 "Sender" refers to users who send packages through the Platform.{'\n'}
          1.3 "Traveler" refers to users who carry and deliver packages.{'\n'}
          1.4 "Services" refers to all services provided by BAGGO.
        </Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.text}>
          2.1 You must be at least 18 years of age to use our Services.{'\n'}
          2.2 You must have the legal capacity to enter into binding contracts.{'\n'}
          2.3 You must provide accurate and complete information during registration.{'\n'}
          2.4 You are responsible for maintaining the confidentiality of your account.
        </Text>

        <Text style={styles.sectionTitle}>3. User Obligations</Text>
        <Text style={styles.text}>
          3.1 Senders must accurately describe package contents.{'\n'}
          3.2 Prohibited items include: illegal substances, weapons, hazardous materials, perishable
          goods without proper packaging.{'\n'}
          3.3 Travelers must handle packages with reasonable care.{'\n'}
          3.4 Users must comply with all applicable laws and regulations.
        </Text>

        <Text style={styles.sectionTitle}>4. Payment and Fees</Text>
        <Text style={styles.text}>
          4.1 Service fees are clearly displayed before transaction completion.{'\n'}
          4.2 BAGGO charges a 10% service fee on all transactions.{'\n'}
          4.3 Payment processing is handled by secure third-party providers.{'\n'}
          4.4 Refunds are subject to our refund policy.
        </Text>

        <Text style={styles.sectionTitle}>5. Insurance</Text>
        <Text style={styles.text}>
          5.1 Optional insurance is available at €0.50 per kilogram.{'\n'}
          5.2 Insurance covers loss or damage during transit.{'\n'}
          5.3 Claims must be filed within 48 hours of delivery date.{'\n'}
          5.4 Maximum coverage is €500 per package.
        </Text>

        <Text style={styles.sectionTitle}>6. Liability and Disclaimers</Text>
        <Text style={styles.text}>
          6.1 BAGGO acts as an intermediary platform connecting Senders and Travelers.{'\n'}
          6.2 We do not guarantee the condition, legality, or accuracy of packages.{'\n'}
          6.3 Users agree to indemnify BAGGO against any claims arising from their use of Services.{'\n'}
          6.4 Our liability is limited to the amount paid for the specific transaction.
        </Text>

        <Text style={styles.sectionTitle}>7. Dispute Resolution</Text>
        <Text style={styles.text}>
          7.1 Disputes should first be resolved through our support team.{'\n'}
          7.2 If unresolved, disputes will be subject to mediation.{'\n'}
          7.3 Any legal proceedings must be conducted in accordance with EU law.{'\n'}
          7.4 Jurisdiction is established in the country where BAGGO is registered.
        </Text>

        <Text style={styles.sectionTitle}>8. Data Protection (GDPR Compliance)</Text>
        <Text style={styles.text}>
          8.1 We process personal data in accordance with EU GDPR.{'\n'}
          8.2 Users have the right to access, rectify, and delete their personal data.{'\n'}
          8.3 Data is stored securely and not shared without consent.{'\n'}
          8.4 See our Privacy Policy for detailed information.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.text}>
          9.1 Either party may terminate their account at any time.{'\n'}
          9.2 BAGGO reserves the right to suspend or terminate accounts for violations.{'\n'}
          9.3 Upon termination, pending transactions must be completed.{'\n'}
          9.4 Data retention is subject to our Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.text}>
          10.1 We may update these Terms at any time.{'\n'}
          10.2 Users will be notified of significant changes.{'\n'}
          10.3 Continued use after changes constitutes acceptance.
        </Text>

        <Text style={styles.sectionTitle}>11. Consumer Rights (EU)</Text>
        <Text style={styles.text}>
          11.1 EU consumers have a 14-day cooling-off period for unused services.{'\n'}
          11.2 You have the right to cancel before service execution.{'\n'}
          11.3 Refunds will be processed within 14 days of cancellation.{'\n'}
          11.4 These rights comply with EU Consumer Rights Directive 2011/83/EU.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Information</Text>
        <Text style={styles.text}>
          For questions about these Terms, contact us at:{'\n\n'}
          Email: legal@baggo.eu{'\n'}
          Address: BAGGO Services Ltd., 123 Innovation Street, Brussels, Belgium{'\n'}
          Phone: +32 2 123 4567
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
});
