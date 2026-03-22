import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search, ChevronRight, Package, Clock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';

const COLORS = {
  primary: '#5845D8',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  gray900: '#111827',
  gray600: '#4B5563',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  green: '#10B981',
};

export default function TrackingScreen() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  const handleTrack = () => {
    if (!trackingNumber) return Alert.alert('Error', 'Please enter a tracking number');
    setIsTracking(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Packages</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tracking Input */}
        <View style={styles.searchCard}>
          <Text style={styles.inputLabel}>Enter Tracking Number</Text>
          <View style={styles.inputRow}>
            <TextInput 
              placeholder="e.g. BAGO-12345-XYZ" 
              style={styles.input}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholderTextColor={COLORS.gray400}
            />
            <Pressable style={styles.trackBtn} onPress={handleTrack}>
              <Search size={20} color={COLORS.white} />
            </Pressable>
          </View>
        </View>

        {isTracking ? (
          <View style={styles.resultsContainer}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>In Transit</Text>
                </View>
                <Text style={styles.etaText}>ETA: Oct 25, 2023</Text>
              </View>
              
              <Text style={styles.shipmentTitle}>Electronics (MacBook Pro)</Text>
              <Text style={styles.routeText}>London, UK → Lagos, NG</Text>
              
              <View style={styles.timeline}>
                <TimelineStep 
                  time="today, 10:45 AM" 
                  label="Arrived at sorting facility" 
                  sub="Lagos Main Hub" 
                  active 
                />
                <TimelineStep 
                  time="Oct 20, 08:30 PM" 
                  label="Departed from origin" 
                  sub="London Heathrow Airport" 
                />
                <TimelineStep 
                  time="Oct 19, 02:15 PM" 
                  label="Package picked up" 
                  sub="Carrier: David O." 
                />
                <TimelineStep 
                  time="Oct 18, 11:00 AM" 
                  label="Shipment Created" 
                  sub="Waiting for pickup" 
                  isLast
                />
              </View>
            </View>

            <View style={styles.securityBox}>
              <ShieldCheck size={20} color={COLORS.primary} />
              <Text style={styles.securityText}>Verified Carrier • Insured Shipment</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MapPin size={80} color={COLORS.gray400} />
            </View>
            <Text style={styles.emptyTitle}>Track your packages</Text>
            <Text style={styles.emptySubtitle}>
              Enter your tracking number above to see real-time updates on your shipment status.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineStep({ time, label, sub, active, isLast }: any) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepDot, active && styles.stepDotActive]} />
        {!isLast && <View style={styles.stepLine} />}
      </View>
      <View style={styles.stepRight}>
        <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
        <Text style={styles.stepSub}>{sub}</Text>
        <Text style={styles.stepTime}>{time}</Text>
      </View>
    </View>
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
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  trackBtn: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
    gap: 20,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  etaText: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: '600',
  },
  shipmentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: 4,
    marginBottom: 24,
  },
  timeline: {
    marginTop: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 80,
  },
  stepLeft: {
    alignItems: 'center',
    width: 20,
    marginRight: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray200,
    zIndex: 1,
    marginTop: 6,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#EEF2FF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: -2,
  },
  stepRight: {
    flex: 1,
    paddingBottom: 24,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray400,
  },
  stepLabelActive: {
    color: COLORS.gray900,
  },
  stepSub: {
    fontSize: 14,
    color: COLORS.gray400,
    marginTop: 2,
  },
  stepTime: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 4,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  securityText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
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
    fontSize: 20,
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
