import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ArrowRight, Heart } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export default function GiftItemsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Items</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
           <Image 
              source={{ uri: 'https://res.cloudinary.com/dmito8es3/image/upload/v1774133882/international_gift_delivery_1774133882785.png' }} 
              style={styles.heroImg} 
           />
           <View style={styles.heroOverlay}>
              <Heart size={32} color={COLORS.white} />
              <Text style={styles.heroTitle}>Send love across borders</Text>
              <Text style={styles.heroDesc}>Whether it's a birthday gift, a holiday surprise, or just because, Bago makes sending gifts to your loved ones easy and affordable.</Text>
           </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Select a Gift</Text>
              <Text style={styles.stepDesc}>Buy your gift from any local or online store.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Find a Traveler</Text>
              <Text style={styles.stepDesc}>Search for travelers heading to your recipient's city.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Delivered with Care</Text>
              <Text style={styles.stepDesc}>Your traveler delivers the gift personally to your loved one.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/trips-list')}>
          <Text style={styles.primaryBtnText}>Find a Traveler for your Gift</Text>
          <ArrowRight size={20} color={COLORS.white} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { flex: 1, padding: 24 },
  heroCard: { height: 260, borderRadius: 32, overflow: 'hidden', marginBottom: 40 },
  heroImg: { width: '100%', height: '100%', opacity: 0.9 },
  heroOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(92, 75, 253, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white, marginTop: 16, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 12, lineHeight: 20, fontWeight: '600' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 24 },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  stepInfo: { flex: 1 },
  stepLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  stepDesc: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', lineHeight: 20 },
  primaryBtn: { backgroundColor: COLORS.black, height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' }
});
