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
import { Colors } from '@/constants/Colors';
import { MapPin, Plus, Minus, Locate } from 'lucide-react-native';

export default function AddAddressScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('Jaydon');
  const [lastName, setLastName] = useState('Franci');
  const [address, setAddress] = useState('East 98th Street, New York');
  const [aptSuite, setAptSuite] = useState('32');
  const [postcode, setPostcode] = useState('1234');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street, Address and City</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter full address"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Apt, Suite</Text>
              <TextInput
                style={styles.input}
                value={aptSuite}
                onChangeText={setAptSuite}
                placeholder="32"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Postcode</Text>
              <TextInput
                style={styles.input}
                value={postcode}
                onChangeText={setPostcode}
                placeholder="1234"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>Hamilton</Text>
            <View style={styles.mapMarker}>
              <MapPin size={32} color={Colors.success} fill={Colors.successLight} />
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

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Add New Address</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: Colors.text,
  },
  mapContainer: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 60,
  },
  mapMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -16,
  },
  mapControls: {
    position: 'absolute',
    bottom: 20,
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
    bottom: 20,
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
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
