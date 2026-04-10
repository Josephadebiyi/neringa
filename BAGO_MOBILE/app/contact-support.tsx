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
          <ChevronLeft size={24} color={'#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contactMethods}>
          <TouchableOpacity style={styles.contactCard}>
            <Mail size={24} color={'#5845D8'} />
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactText}>support@baggo.eu</Text>
            <Text style={styles.contactHours}>Response within 24h</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <Phone size={24} color={'#5845D8'} />
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactText}>+32 2 123 4567</Text>
            <Text style={styles.contactHours}>Mon-Fri 9AM-6PM CET</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <MessageCircle size={24} color={'#5845D8'} />
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
            placeholderTextColor={'#9E9E9E'}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide detailed information about your issue..."
            placeholderTextColor={'#9E9E9E'}
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Send size={20} color={'#FFFFFF'} />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <HelpCircle size={20} color={'#5845D8'} />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>

          <TouchableOpacity style={styles.resourceCard}>
            <FileText size={20} color={'#5845D8'} />
            <Text style={styles.resourceTitle}>Help Center</Text>
            <Text style={styles.resourceDesc}>Browse our complete documentation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <AlertCircle size={20} color={'#5845D8'} />
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
  },
  contactMethods: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#5845D8',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactHours: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  categoryButtonActive: {
    backgroundColor: '#5845D8',
    borderColor: '#5845D8',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 120,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#5845D8',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    color: '#6B6B6B',
  },
});
