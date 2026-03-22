import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Linking, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Search, MessageCircle, Mail, HelpCircle, Phone, Book } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
          />
        </View>

        <Text style={styles.sectionHeader}>QUICK HELP</Text>
        <View style={styles.helpGrid}>
          <HelpCard icon={<MessageCircle size={28} color={COLORS.primary} />} title="Live Chat" desc="Average response: 5m" />
          <HelpCard icon={<Mail size={28} color={COLORS.accentTeal} />} title="Email Support" desc="support@bago.com" />
          <HelpCard icon={<Book size={28} color={COLORS.accentAmber} />} title="Knowledge Base" desc="Articles & FAQs" />
          <HelpCard icon={<Phone size={28} color={COLORS.accentCoral} />} title="Call Us" desc="+1 (800) BAGO-HELP" />
        </View>

        <Text style={styles.sectionHeader}>POPULAR ARTICLES</Text>
        <View style={styles.articleList}>
          <ArticleItem title="How to post a trip on Bago" />
          <ArticleItem title="Tracking your package efficiently" />
          <ArticleItem title="What items are restricted?" />
          <ArticleItem title="Our Escrow payment protection" isLast={true} />
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

function ArticleItem({ title, isLast }: any) {
  return (
    <Pressable style={[styles.articleItem, isLast && styles.articleItemLast]}>
      <Text style={styles.articleText}>{title}</Text>
      <ChevronLeft size={18} color={COLORS.gray300} style={{ transform: [{ rotate: '180deg'}] }} />
    </Pressable>
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
  articleText: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  footerInfo: { marginTop: 40, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 12, color: COLORS.gray400, fontWeight: '600', marginBottom: 4 }
});
