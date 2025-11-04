import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
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
            <MapPin size={24} color={Colors.success} fill={Colors.successLight} />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>Your Location</Text>
            </View>
          </View>

          <View style={[styles.mapMarker, { top: 200, left: 200 }]}>
            <MapPin size={24} color={Colors.primary} fill={Colors.purpleLight} />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>Destination</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapButton}>
            <Minus size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton}>
            <Plus size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.locateButton}>
          <Locate size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MapPin size={18} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoText}>32 East 98th Street, New York...</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <MapPin size={18} color={Colors.secondary} />
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.text,
  },
  mapSubtext: {
    position: 'absolute',
    top: '52%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textLight,
  },
  routeLine: {
    position: 'absolute',
    top: 120,
    left: 100,
    width: 120,
    height: 100,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerLabel: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
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
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
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
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
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
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
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
    color: Colors.textLight,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
});
