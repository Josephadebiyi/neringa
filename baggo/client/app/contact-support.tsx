import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Phone, MessageCircle, Send, Circle as HelpCircle, FileText, CircleAlert as AlertCircle, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const faqs = [
  {
    question: 'How long does delivery take?',
    answer: 'Delivery time depends on the traveler\'s schedule. Most packages are delivered within 3-7 days.',
  },
  {
    question: 'What items are prohibited?',
    answer: 'Illegal substances, weapons, hazardous materials, and perishable goods without proper packaging are prohibited.',
  },
  {
    question: 'How does insurance work?',
    answer: 'Insurance costs €0.50 per kg and covers loss or damage up to €500. Claims must be filed within 48 hours.',
  },
  {
    question: 'How do I become a verified traveler?',
    answer: 'Complete KYC verification by submitting your ID, proof of address, and a selfie. Approval takes 24-48 hours.',
  },
];

export default function ContactSupportScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const categories = [
    'Account Issues',
    'Payment Problems',
    'Package Delivery',
    'Technical Support',
    'Verification',
    'Other',
  ];

  const handleSubmit = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contactMethods}>
          <TouchableOpacity style={styles.contactCard}>
            <Mail size={24} color={colors.primary} />
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactText}>support@baggo.eu</Text>
            <Text style={styles.contactHours}>Response within 24h</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <Phone size={24} color={colors.primary} />
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactText}>+32 2 123 4567</Text>
            <Text style={styles.contactHours}>Mon-Fri 9AM-6PM CET</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <MessageCircle size={24} color={colors.primary} />
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactText}>Start a conversation</Text>
            <Text style={styles.contactHours}>Available 24/7</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide detailed information about your issue..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Send size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <HelpCircle size={20} color={colors.primary} />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>

          <TouchableOpacity style={styles.resourceCard}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.resourceTitle}>Help Center</Text>
            <Text style={styles.resourceDesc}>Browse our complete documentation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <AlertCircle size={20} color={colors.primary} />
            <Text style={styles.resourceTitle}>Report an Issue</Text>
            <Text style={styles.resourceDesc}>Report technical problems or bugs</Text>
          </TouchableOpacity>
        </View>

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
  },
  contactMethods: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactHours: {
    fontSize: 11,
    color: colors.textMuted,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  resourceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    color: colors.textLight,
  },
});
