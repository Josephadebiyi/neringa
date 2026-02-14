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
import { CreditCard } from 'lucide-react-native';

export default function PaymentMethodScreen() {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState('1234 5678 1234 ••••');
  const [cardholderName, setCardholderName] = useState('Jaydon Franci');
  const [cardNumberFull, setCardNumberFull] = useState('1234 5678 9987 6543');
  const [expiration, setExpiration] = useState('32');
  const [cvv, setCvv] = useState('12');
  const [postcode, setPostcode] = useState('1234');

  const [selectedCard, setSelectedCard] = useState('card1');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Credit Card</Text>

        <TouchableOpacity
          style={[
            styles.cardOption,
            selectedCard === 'card1' && styles.cardOptionActive,
          ]}
          onPress={() => setSelectedCard('card1')}
        >
          <View style={styles.cardIcon}>
            <View style={[styles.cardLogo, { backgroundColor: '#EB001B' }]} />
            <View style={[styles.cardLogo, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
          </View>
          <Text style={styles.cardNumber}>{cardNumber}</Text>
          <View style={styles.radio}>
            {selectedCard === 'card1' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cardOption,
            selectedCard === 'card2' && styles.cardOptionActive,
          ]}
          onPress={() => setSelectedCard('card2')}
        >
          <View style={styles.cardIcon}>
            <View style={[styles.cardLogo, { backgroundColor: '#EB001B' }]} />
            <View style={[styles.cardLogo, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
          </View>
          <Text style={styles.cardNumber}>1234 5678 1234 ••••</Text>
          <View style={styles.radio}>
            {selectedCard === 'card2' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Payment</Text>
        </TouchableOpacity>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Cardholder Name</Text>
          <TextInput
            style={styles.input}
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholder="Cardholder Name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.formTitle}>Card Number</Text>
          <TextInput
            style={styles.input}
            value={cardNumberFull}
            onChangeText={setCardNumberFull}
            placeholder="Card Number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.formTitle}>Expiration</Text>
              <TextInput
                style={styles.input}
                value={expiration}
                onChangeText={setExpiration}
                placeholder="MM/YY"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.formTitle}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="CVV"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
              />
            </View>
          </View>

          <Text style={styles.formTitle}>Postal Code</Text>
          <TextInput
            style={styles.input}
            value={postcode}
            onChangeText={setPostcode}
            placeholder="Postal Code"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>

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
    paddingTop: 60,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardOptionActive: {
    borderColor: Colors.primary,
  },
  cardIcon: {
    flexDirection: 'row',
    marginRight: 12,
  },
  cardLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  cardNumber: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  addButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textLight,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
  },
  formTitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
    marginTop: 12,
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
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
