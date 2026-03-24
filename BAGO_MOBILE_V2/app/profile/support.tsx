import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Linking, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, Search, MessageCircle, Mail, HelpCircle, Phone, Book } from 'lucide-react-native';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const FAQS = [
  { q: "How do I post a trip on Bago?", a: "To post a trip, toggle to 'Earn as Traveler' in your profile, then click the 'Publish New Itinerary' button on your home screen. Provide your travel date, departure, arrival, and available baggage space." },
  { q: "How can I track my package efficiently?", a: "Go to your 'Shipments' tab from the bottom menu, tap on your active shipment, and click 'Track Delivery'. You'll see real-time status updates as the traveler moves." },
  { q: "What items are restricted on Bago?", a: "We prohibit illegal substances, firearms, explosives, highly perishable goods, and unauthorized hazardous materials. Always check aviation guidelines for your specific airline." },
  { q: "How does the Escrow payment protection work?", a: "When a sender pays, the money is held in Bago's secure Escrow. The traveler only receives the funds once the sender confirms they have received the package in good condition." },
];

export default function SupportScreen() {
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>How can we help you today?</Text>
        
        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.primary} />
          <TextInput 
            placeholder="Search help topics..."
            style={styles.searchInput}
            placeholderTextColor={COLORS.gray400}
          />
        </View>

        <Text style={styles.sectionHeader}>QUICK HELP</Text>
        <View style={styles.helpGrid}>
          <HelpCard icon={<MessageCircle size={28} color={COLORS.primary} />} title="Live Chat" desc="Average response: 5m" />
          <HelpCard icon={<Mail size={28} color={COLORS.accentTeal} />} title="Email Support" desc="help@sendwithbago.com" />
          <HelpCard icon={<Book size={28} color={COLORS.accentAmber} />} title="Knowledge Base" desc="Articles & FAQs" />
          <HelpCard icon={<Phone size={28} color={COLORS.accentCoral} />} title="Call Us" desc="+234 8081008086" />
        </View>

        <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.articleList}>
          {FAQS.map((faq, index) => (
             <FAQItem key={index} question={faq.q} answer={faq.a} isLast={index === FAQS.length - 1} />
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Bago Support v2.1.0</Text>
          <Text style={styles.footerText}>Available 24/7 for our verified members</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HelpCard({ icon, title, desc }: any) {
  return (
    <TouchableOpacity style={styles.helpCard}>
      <View style={styles.helpIconBg}>{icon}</View>
      <Text style={styles.helpTitle}>{title}</Text>
      <Text style={styles.helpDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

function FAQItem({ question, answer, isLast }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.faqContainer, isLast && styles.articleItemLast]}>
      <Pressable style={styles.faqHeaderBtn} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.articleText}>{question}</Text>
        {isOpen ? <ChevronDown size={18} color={COLORS.primary} /> : <ChevronLeft size={18} color={COLORS.gray300} style={{ transform: [{ rotate: '180deg'}] }} />}
      </Pressable>
      {isOpen && (
         <View style={styles.faqAnswerBox}>
            <Text style={styles.faqAnswerText}>{answer}</Text>
         </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: COLORS.black, marginBottom: 24, textAlign: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgSoft, borderRadius: 16, height: 56, paddingHorizontal: 16, marginBottom: 32 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.black },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 16 },
  helpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  helpCard: { width: (width - 60) / 2, backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 20, alignItems: 'center' },
  helpIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  helpTitle: { fontSize: 15, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  helpDesc: { fontSize: 11, color: COLORS.gray500, fontWeight: '600', textAlign: 'center' },
  articleList: { backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 8 },
  articleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.white },
  articleItemLast: { borderBottomWidth: 0 },
  articleText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.black, paddingRight: 10 },
  faqContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.white },
  faqHeaderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  faqAnswerBox: { paddingHorizontal: 16, paddingBottom: 16 },
  faqAnswerText: { fontSize: 13, color: COLORS.gray600, lineHeight: 20, fontWeight: '500' },
  footerInfo: { marginTop: 40, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 12, color: COLORS.gray400, fontWeight: '600', marginBottom: 4 }
});
