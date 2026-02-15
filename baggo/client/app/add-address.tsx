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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: colors.textLight }]}>First Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textLight }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textLight }]}>Street, Address and City</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter full address"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: colors.textLight }]}>Apt, Suite</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                value={aptSuite}
                onChangeText={setAptSuite}
                placeholder="32"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textLight }]}>Postcode</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                value={postcode}
                onChangeText={setPostcode}
                placeholder="1234"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.successBg }]}>
            <Text style={[styles.mapText, { color: colors.text }]}>Hamilton</Text>
            <View style={styles.mapMarker}>
              <MapPin size={32} color={colors.success} />
            </View>
          </View>

          <View style={styles.mapControls}>
            <TouchableOpacity style={[styles.mapButton, { backgroundColor: colors.card }]}>
              <Minus size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapButton, { backgroundColor: colors.card }]}>
              <Plus size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.locateButton, { backgroundColor: colors.text }]}>
            <Locate size={20} color={colors.background} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>Add New Address</Text>
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
