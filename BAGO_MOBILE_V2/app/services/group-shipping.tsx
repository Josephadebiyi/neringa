import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Scale, Globe, ArrowRight, Package, Users } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export default function GroupShippingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Shipping</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
           <Image 
              source={{ uri: 'https://res.cloudinary.com/dmito8es3/image/upload/v1774134114/group_shipping_logistics_1774134113829.png' }} 
              style={styles.heroImg} 
           />
           <View style={styles.heroOverlay}>
              <Users size={32} color={COLORS.white} />
              <Text style={styles.heroTitle}>Lower Costs, Together</Text>
              <Text style={styles.heroDesc}>Shipping bulky or multiple items? Join a group of senders to share weight capacity and lower the cost for everyone!</Text>
           </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits of Grouping</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Globe size={16} color={COLORS.primary} /></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Consolidated Logistics</Text>
              <Text style={styles.stepDesc}>Bago handles the complex process of joining multiple small items into a larger shipment.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Scale size={16} color={COLORS.primary} /></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Cost Efficiency</Text>
              <Text style={styles.stepDesc}>By grouping, you pay a fraction of what you would for an individual international shipment.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Package size={16} color={COLORS.primary} /></View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>No Item Too Small</Text>
              <Text style={styles.stepDesc}>Even if you only have one small item, join a group and get it shipped at a bulk rate.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>Find a Shipping Group</Text>
          <ArrowRight size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ height: 40 }} />
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
  heroOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(5, 71, 82, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white, marginTop: 16, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 12, lineHeight: 20, fontWeight: '600' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 24 },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1 },
  stepLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  stepDesc: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', lineHeight: 20 },
  primaryBtn: { backgroundColor: COLORS.black, height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' }
});
