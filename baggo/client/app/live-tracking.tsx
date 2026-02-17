import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Plus, Minus, Locate } from 'lucide-react-native';

export default function LiveTrackingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Interactive Map View</Text>
          <Text style={styles.mapSubtext}>Hamilton → Destination</Text>

          <View style={styles.routeLine} />

          <View style={[styles.mapMarker, { top: 100, left: 80 }]}>
            <MapPin size={24} color={#22C55E} fill={#22C55ELight} />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>Your Location</Text>
            </View>
          </View>

          <View style={[styles.mapMarker, { top: 200, left: 200 }]}>
            <MapPin size={24} color={#6366F1} fill={colors.purpleLight} />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>Destination</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapButton}>
            <Minus size={20} color={#111111} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton}>
            <Plus size={20} color={#111111} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.locateButton}>
          <Locate size={20} color={#FFFFFF} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MapPin size={18} color={#6366F1} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoText}>32 East 98th Street, New York...</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <MapPin size={18} color={#EC4899} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Shipping to</Text>
            <Text style={styles.infoText}>123 East 12th Street, New York...</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: #F8F6F3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: #FFFFFF,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: #111111,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: #111111,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  mapText: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: #111111,
  },
  mapSubtext: {
    position: 'absolute',
    top: '52%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: #111111Light,
  },
  routeLine: {
    position: 'absolute',
    top: 120,
    left: 100,
    width: 120,
    height: 100,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: #6366F1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerLabel: {
    backgroundColor: #22C55E,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '600',
    color: #FFFFFF,
  },
  mapControls: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    gap: 12,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: #FFFFFF,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: #000000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locateButton: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: #111111,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: #000000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: #FFFFFF,
    borderRadius: 20,
    padding: 20,
    shadowColor: #000000,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: #111111Light,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
    color: #111111,
  },
  divider: {
    height: 1,
    backgroundColor: #E5E7EB,
    marginVertical: 16,
  },
});
