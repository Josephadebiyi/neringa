import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, X, Minus, Plus } from 'lucide-react-native';

export default function CheckRatesScreen() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState('32 East 98th Street, New...');
  const [dropoffLocation, setDropoffLocation] = useState('123 East 12th Street, New...');
  const [weight, setWeight] = useState(1);
  const [quantity, setQuantity] = useState(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check Rates</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calculate for Shipment</Text>
          <Text style={styles.cardSubtitle}>
            Set notification preferences for your purchases, payment & deliveries.
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>Pickup - Point</Text>
            <View style={styles.inputRow}>
              <MapPin size={20} color={colors.textLight} />
              <TextInput
                style={styles.input}
                value={pickupLocation}
                onChangeText={setPickupLocation}
                placeholder="Enter pickup location"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => setPickupLocation('')}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Drop Off - Point</Text>
            <View style={styles.inputRow}>
              <MapPin size={20} color={colors.textLight} />
              <TextInput
                style={styles.input}
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
                placeholder="Enter drop-off location"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => setDropoffLocation('')}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>{weight} Kg</Text>
              </View>
            </View>

            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                  style={styles.quantityButton}
                >
                  <Minus size={16} color={colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity} Package</Text>
                <TouchableOpacity 
                  onPress={() => setQuantity(quantity + 1)}
                  style={[styles.quantityButton, styles.quantityButtonActive]}
                >
                  <Plus size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Check Rates</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estimated Delivery Date</Text>
          <Text style={styles.deliveryDate}>6:30 pm • Feb 2th 2023</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 15,
    color: colors.text,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonActive: {
    backgroundColor: colors.gold,
  },
  quantityText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  deliveryDate: {
    fontSize: 15,
    color: colors.textLight,
  },
});
