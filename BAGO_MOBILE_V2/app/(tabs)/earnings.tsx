import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';

const COLORS = {
  primary: '#5845D8',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  gray900: '#111827',
  gray600: '#4B5563',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
};

export default function EarningsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Wallet size={80} color={COLORS.gray400} />
          </View>
          <Text style={styles.emptyTitle}>$0.00</Text>
          <Text style={styles.emptySubtitle}>
            Balance from your deliveries.{'\n'}Once you complete a delivery, it appears here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gray900,
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 22,
  },
});
