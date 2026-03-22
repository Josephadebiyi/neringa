import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, MapPin, ArrowRight, Trash2 } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const MOCK_ROUTES = [
  { id: '1', from: 'Madrid', to: 'Lisbon', frequency: 'Daily' },
  { id: '2', from: 'Paris', to: 'London', frequency: 'Weekly' },
];

export default function SavedRoutesScreen() {
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
        <Text style={styles.headerTitle}>Saved routes</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={MOCK_ROUTES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <View style={styles.routePath}>
                <View style={styles.dot} />
                <View style={styles.line} />
                <View style={[styles.dot, { backgroundColor: COLORS.accentLime }]} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.cityText}>{item.from}</Text>
                <Text style={styles.cityText}>{item.to}</Text>
              </View>
              <Pressable style={styles.deleteBtn}>
                <Trash2 size={18} color={COLORS.accentCoral} />
              </Pressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.footer}>
              <Text style={styles.freqBadge}>{item.frequency}</Text>
              <Pressable style={styles.searchAgain}>
                <Text style={styles.searchText}>Search Again</Text>
                <ArrowRight size={14} color={COLORS.primary} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No saved routes found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  list: { padding: 24 },
  routeCard: { backgroundColor: COLORS.bgSoft, borderRadius: 24, padding: 20, marginBottom: 16 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  routePath: { alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  line: { width: 2, height: 20, backgroundColor: COLORS.gray200 },
  routeInfo: { flex: 1, gap: 12 },
  cityText: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  deleteBtn: { padding: 8 },
  divider: { height: 1, backgroundColor: COLORS.white, marginVertical: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  freqBadge: { fontSize: 12, fontWeight: '800', color: COLORS.primary, backgroundColor: COLORS.primarySoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  searchAgain: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  empty: { textAlign: 'center', marginTop: 100, color: COLORS.gray400, fontSize: 15, fontWeight: '600' }
});
