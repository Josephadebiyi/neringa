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
import { MapPin, Plus, Minus, Locate } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function AddAddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState('Jaydon');
  const [lastName, setLastName] = useState('Franci');
  const [address, setAddress] = useState('East 98th Street, New York');
  const [aptSuite, setAptSuite] = useState('32');
  const [postcode, setPostcode] = useState('1234');

  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: '#1A1A1A' }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#1A1A1A' }]}>Add New Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formSection, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: '#1A1A1A'Light }]}>First Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F3F4F6', color: '#1A1A1A' }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={'#9E9E9E'}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: '#1A1A1A'Light }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F3F4F6', color: '#1A1A1A' }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={'#9E9E9E'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#1A1A1A'Light }]}>Street, Address and City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#F3F4F6', color: '#1A1A1A' }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter full address"
              placeholderTextColor={'#9E9E9E'}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: '#1A1A1A'Light }]}>Apt, Suite</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F3F4F6', color: '#1A1A1A' }]}
                value={aptSuite}
                onChangeText={setAptSuite}
                placeholder="32"
                placeholderTextColor={'#9E9E9E'}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: '#1A1A1A'Light }]}>Postcode</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F3F4F6', color: '#1A1A1A' }]}
                value={postcode}
                onChangeText={setPostcode}
                placeholder="1234"
                placeholderTextColor={'#9E9E9E'}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <View style={[styles.mapPlaceholder, { backgroundColor: '#4CAF50'Bg }]}>
            <Text style={[styles.mapText, { color: '#1A1A1A' }]}>Hamilton</Text>
            <View style={styles.mapMarker}>
              <MapPin size={32} color={'#4CAF50'} />
            </View>
          </View>

          <View style={styles.mapControls}>
            <TouchableOpacity style={[styles.mapButton, { backgroundColor: '#FFFFFF' }]}>
              <Minus size={20} color={'#1A1A1A'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapButton, { backgroundColor: '#FFFFFF' }]}>
              <Plus size={20} color={'#1A1A1A'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.locateButton, { backgroundColor: '#1A1A1A' }]}>
            <Locate size={20} color={'#F8F6F3'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#5845D8' }]}>
          <Text style={[styles.submitButtonText, { color: '#1A1A1A'Inverse }]}>Add New Address</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
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
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
