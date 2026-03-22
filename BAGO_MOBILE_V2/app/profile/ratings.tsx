import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Star, Clock, User } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const MOCK_RATINGS = [
  { id: '1', name: 'Alex M.', rating: 5, date: 'Oct 12, 2023', comment: 'Excellent carrier, very professional and delivered on time!' },
  { id: '2', name: 'Sarah J.', rating: 4, date: 'Sep 28, 2023', comment: 'Good communication, package arrived safely.' },
];

export default function RatingsScreen() {
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
        <Text style={styles.headerTitle}>Ratings you've left</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={MOCK_RATINGS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.ratingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.userSection}>
                <View style={styles.avatarMini}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                <View>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
              </View>
              <View style={styles.stars}>
                {[1,2,3,4,5].map(s => <Star key={s} size={14} color={s <= item.rating ? COLORS.accentAmber : COLORS.gray200} fill={s <= item.rating ? COLORS.accentAmber : 'none'} />)}
              </View>
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>You haven't left any ratings yet.</Text>}
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
  ratingCard: { backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  dateText: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 14, color: COLORS.gray600, lineHeight: 20, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 100, color: COLORS.gray400, fontSize: 15, fontWeight: '600' }
});
