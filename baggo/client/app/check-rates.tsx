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
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={pickupLocation}
                onChangeText={setPickupLocation}
                placeholder="Enter pickup location"
                placeholderTextColor="rgba(17,17,17,0.35)"
              />
              <TouchableOpacity onPress={() => setPickupLocation('')}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Drop Off - Point</Text>
            <View style={styles.inputRow}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
                placeholder="Enter drop-off location"
                placeholderTextColor="rgba(17,17,17,0.35)"
              />
              <TouchableOpacity onPress={() => setDropoffLocation('')}>
                <X size={20} color="#6B7280" />
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
                  <Minus size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity} Package</Text>
                <TouchableOpacity 
                  onPress={() => setQuantity(quantity + 1)}
                  style={[styles.quantityButton, styles.quantityButtonActive]}
                >
                  <Plus size={16} color="#FFFFFF" />
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
    backgroundColor: #F8F6F3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: #FFFFFF,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: #000000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: #111111,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: #111111Light,
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: #111111Light,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: #F8F6F3,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: #111111,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    backgroundColor: #F8F6F3,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 15,
    color: #111111,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: #F8F6F3,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: #FFFFFF,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonActive: {
    backgroundColor: #F59E0B,
  },
  quantityText: {
    fontSize: 14,
    color: #111111,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: #6366F1,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: #FFFFFF,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: #111111,
    marginBottom: 8,
  },
  deliveryDate: {
    fontSize: 15,
    color: #111111Light,
  },
});
