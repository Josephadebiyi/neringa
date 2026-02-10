import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { MapPin, Weight, Shield, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { backendomain } from '@/utils/backendDomain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ShippingRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
const [currencySymbol, setCurrencySymbol] = useState("€"); // default



const countryCurrencyMap = {
  // Africa
  "nigeria": { code: "NGN", symbol: "₦" },
  "ghana": { code: "GHS", symbol: "₵" },
  "kenya": { code: "KES", symbol: "KSh" },
  "south africa": { code: "ZAR", symbol: "R" },
  "egypt": { code: "EGP", symbol: "£" },
  "tanzania": { code: "TZS", symbol: "TSh" },
  "uganda": { code: "UGX", symbol: "USh" },
  "morocco": { code: "MAD", symbol: "DH" },
  "algeria": { code: "DZD", symbol: "DA" },
  "sudan": { code: "SDG", symbol: "£" },
  "côte d'ivoire": { code: "XOF", symbol: "CFA" },
  "cameroon": { code: "XAF", symbol: "FCFA" },

  // Americas
  "united states": { code: "USD", symbol: "$" },
  "usa": { code: "USD", symbol: "$" },
  "canada": { code: "CAD", symbol: "CA$" },
  "mexico": { code: "MXN", symbol: "$" },
  "brazil": { code: "BRL", symbol: "R$" },
  "argentina": { code: "ARS", symbol: "$" },
  "chile": { code: "CLP", symbol: "$" },
  "colombia": { code: "COP", symbol: "$" },
  "peru": { code: "PEN", symbol: "S/" },
  "uruguay": { code: "UYU", symbol: "$U" },

  // Europe
  "germany": { code: "EUR", symbol: "€" },
  "france": { code: "EUR", symbol: "€" },
  "italy": { code: "EUR", symbol: "€" },
  "spain": { code: "EUR", symbol: "€" },
  "austria": { code: "EUR", symbol: "€" },
  "belgium": { code: "EUR", symbol: "€" },
  "cyprus": { code: "EUR", symbol: "€" },
  "estonia": { code: "EUR", symbol: "€" },
  "finland": { code: "EUR", symbol: "€" },
  "greece": { code: "EUR", symbol: "€" },
  "ireland": { code: "EUR", symbol: "€" },
  "latvia": { code: "EUR", symbol: "€" },
  "lithuania": { code: "EUR", symbol: "€" },
  "luxembourg": { code: "EUR", symbol: "€" },
  "malta": { code: "EUR", symbol: "€" },
  "netherlands": { code: "EUR", symbol: "€" },
  "portugal": { code: "EUR", symbol: "€" },
  "slovakia": { code: "EUR", symbol: "€" },
  "slovenia": { code: "EUR", symbol: "€" },
  "united kingdom": { code: "GBP", symbol: "£" },
  "uk": { code: "GBP", symbol: "£" },

  // Asia & Oceania
  "india": { code: "INR", symbol: "₹" },
  "china": { code: "CNY", symbol: "¥" },
  "japan": { code: "JPY", symbol: "¥" },
  "russia": { code: "RUB", symbol: "₽" },
  "turkey": { code: "TRY", symbol: "₺" },
  "united arab emirates": { code: "AED", symbol: "د.إ" },
  "singapore": { code: "SGD", symbol: "S$" },
  "australia": { code: "AUD", symbol: "A$" },
  "new zealand": { code: "NZD", symbol: "NZ$" },
  "switzerland": { code: "CHF", symbol: "CHF" },

  // Middle East
  "saudi arabia": { code: "SAR", symbol: "﷼" },
  "qatar": { code: "QAR", symbol: "﷼" },
  "kuwait": { code: "KWD", symbol: "KD" },
  "bahrain": { code: "BHD", symbol: "BD" },
  "oman": { code: "OMR", symbol: "﷼" },

  // Others
  "south korea": { code: "KRW", symbol: "₩" },
  "north korea": { code: "KPW", symbol: "₩" },
  "thailand": { code: "THB", symbol: "฿" },
  "philippines": { code: "PHP", symbol: "₱" },
  "vietnam": { code: "VND", symbol: "₫" },
  "indonesia": { code: "IDR", symbol: "Rp" },
};


// Save currency to AsyncStorage
const saveCurrency = async (symbol: string) => {
  try {
    await AsyncStorage.setItem('currencySymbol', symbol);
  } catch (err) {
    console.error('Error saving currency:', err);
  }
};

// Load currency from AsyncStorage
const loadCurrency = async (): Promise<string | null> => {
  try {
    const symbol = await AsyncStorage.getItem('currencySymbol');
    return symbol;
  } catch (err) {
    console.error('Error loading currency:', err);
    return null;
  }
};

  // Helper: split "City, Country" into { city, country }
  const parseLocation = (val?: string) => {
    if (!val) return { city: '', country: '' };
    const parts = val.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return { city: '', country: '' };
    if (parts.length === 1) return { city: parts[0], country: '' };
    const country = parts.pop()!;
    const city = parts.join(', ');
    return { city, country };
  };

  const parsedFrom = parseLocation((params.fromCity as string) || (params.from as string) || '');
  const parsedTo = parseLocation((params.toCity as string) || (params.to as string) || '');

  // separate city / country states - MUST be declared before useEffect that uses them
  const [fromCountry, setFromCountry] = useState<string>(
    (params.fromCountry as string) || parsedFrom.country || ''
  );
  const [fromCity, setFromCity] = useState<string>(
    (params.fromCity as string) || parsedFrom.city || ''
  );
  const [toCountry, setToCountry] = useState<string>(
    (params.toCountry as string) || parsedTo.country || ''
  );
  const [toCity, setToCity] = useState<string>(
    (params.toCity as string) || parsedTo.city || ''
  );

useEffect(() => {
  if (!fromCountry) return;

  const key = fromCountry.trim().toLowerCase();
  const currency = countryCurrencyMap[key];

  if (currency) {
    setCurrencySymbol(currency.symbol);
    saveCurrency(currency.symbol); // store for later
  }
}, [fromCountry]);

useEffect(() => {
  (async () => {
    const saved = await loadCurrency();
    if (saved) {
      setCurrencySymbol(saved);
    }
  })();
}, []);

  // initial traveler (display only)
  const initialTraveler = useMemo(
    () => ({
      id: (params.travelerId as string) || (params.id as string) || '1',
      tripId: (params.tripId as string) || null,
      name: (params.travelerName as string) || (params.name as string) || 'Traveler',
      rating: params.rating ? parseFloat(params.rating as string) : 0,
      trips: params.trips ? parseInt(params.trips as string, 10) : 0,
      verified: (params.verified as string) === 'true',
      from: parsedFrom.city || '',
      to: parsedTo.city || '',
      date: (params.date as string) || '',
      availableKg: params.availableKg ? parseFloat(params.availableKg as string) : 0,
      pricePerKg: params.pricePerKg ? parseFloat(params.pricePerKg as string) : 0,
      mode: (params.mode as string) || 'flight',
    }),
    [params, parsedFrom.city, parsedTo.city]
  );

  // image: `image` holds dataURI (data:image/...); imagePreview holds local file:// for display
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [itemValue, setItemValue] = useState<string>('');
  const [insurance, setInsurance] = useState<boolean>(false);
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // preview + fetched price state
  const [fetchedPricePerKg, setFetchedPricePerKg] = useState<number | null>(null);
  const [matchedPriceObj, setMatchedPriceObj] = useState<any>(null);
  const [minWeight, setMinWeight] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0);

  const normalize = (s?: string) => (s || '').trim().toLowerCase();

  // Fetch prices when user types origin/destination so preview shows DB price
  useEffect(() => {
    if (!fromCity || !toCity) {
      setMatchedPriceObj(null);
      setFetchedPricePerKg(null);
      setMinWeight(0);
      setDiscountRate(0);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const resp = await axios.get(`${backendomain.backendomain}/api/prices/get`);
        const prices = resp.data?.prices || resp.data || [];

        console.log('Fetched prices array:', prices); // <--- log full array
        console.log('Number of prices:', prices.length);

        const normalizeCity = (s?: string) =>
          (s || '').trim().toLowerCase().replace(/\s+/g, '');

        const normalizedFrom = normalizeCity(fromCity);
        const normalizedTo = normalizeCity(toCity);

        const found =
        prices.find(p => normalizeCity(p.from) === normalizedFrom && normalizeCity(p.to) === normalizedTo) || null;

      setMatchedPriceObj(found);
      setFetchedPricePerKg(found ? Number(found.pricePerKg) : null);
      setMinWeight(found ? Number(found.minWeightKg || 0) : 0);
      setDiscountRate(found ? Number(found.discountRate || 0) : 0);

        console.log('Preview match:', found);
      } catch (e) {
        console.error('Error fetching price preview:', e);
        if (!mounted) return;
        setMatchedPriceObj(null);
        setFetchedPricePerKg(null);
        setMinWeight(0);
        setDiscountRate(0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fromCity, toCity]);


  // Preview calculations use fetched price (or fallback)
  const pricePerKgUsedForPreview = fetchedPricePerKg ?? initialTraveler.pricePerKg ?? 7;
  const weightNumPreview = Math.max(parseFloat(weight || '0'), minWeight || 0);
  const shippingFeePreview = weightNumPreview * pricePerKgUsedForPreview * (1 - (discountRate || 0));
  const insuranceFeePreview = insurance && itemValue ? parseFloat(itemValue) * 0.02 : 0;
  const serviceFeePreview = shippingFeePreview * 0.15;
  const totalPreview = shippingFeePreview + insuranceFeePreview + serviceFeePreview;

  // pick a single image and set dataURI (+ persist)
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow access to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true, // ⚡ important
      });

      if (result.canceled || !result.assets?.length) return;

      const selectedImage = result.assets[0];

      // Use base64 from picker (no need for ImageManipulator)
      const base64Data = `data:image/jpeg;base64,${selectedImage.base64}`;

      setImage(base64Data);           // ⚡ send this to backend
      setImagePreview(selectedImage.uri); // for showing preview

      await AsyncStorage.setItem('packageImage', base64Data); // optional persist
      console.log('📸 Saved image base64 for upload:', base64Data.slice(0, 50), '...');
    } catch (err: any) {
      console.error('Error picking image:', err);
      Alert.alert('Error', err?.message ?? 'Failed to pick image.');
    }
  };



  const removeImage = async () => {
    setImage(null);
    setImagePreview(null);
    await AsyncStorage.removeItem('packageImage');
  };

  const handleContinue = async () => {
    if (!fromCity || !toCity || !weight || !description || !receiverName || !receiverPhone) {
      Alert.alert('Validation', 'Please fill origin/destination and all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Price logic
      const currentMatch = matchedPriceObj;
      const pricePerKg = currentMatch ? Number(currentMatch.pricePerKg) : (fetchedPricePerKg ?? initialTraveler.pricePerKg ?? 7);
      const minW = currentMatch ? Number(currentMatch.minWeightKg || 0) : minWeight || 0;
      const disc = currentMatch ? Number(currentMatch.discountRate || 0) : discountRate || 0;

      const weightNum = Math.max(parseFloat(weight || '0'), minW);
      let shippingFee = weightNum * pricePerKg;
      if (disc > 0) shippingFee = shippingFee * (1 - disc);

      const insuranceFee = insurance && itemValue ? parseFloat(itemValue) * 0.02 : 0;
      const serviceFee = shippingFee * 0.15;
      const total = shippingFee + insuranceFee + serviceFee;

      // Get image base64 (or from AsyncStorage)
      let dataUri = image || (await AsyncStorage.getItem('packageImage')) || null;

      // ⚡ If image is a file URI, convert to base64
      if (dataUri && dataUri.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(dataUri, { encoding: FileSystem.EncodingType.Base64 });
        dataUri = `data:image/jpeg;base64,${base64}`;
      }

      // Payload for backend (send JSON)
      const payload = {
        travelerId: initialTraveler.id,
        travelerName: initialTraveler.name,
        fromCountry: fromCountry || '',
        fromCity,
        toCountry: toCountry || '',
        toCity,
        packageWeight: weightNum.toString(),
        receiverName,
        receiverPhone,
        description,
        value: parseFloat(itemValue || '0'),
        amount: total.toFixed(2),
        pricePerKg: pricePerKg.toString(),
        tripId: initialTraveler.tripId || '',
        image: dataUri, // ✅ base64 / Data URI
        insurance: insurance ? 'yes' : 'no',
        insuranceCost: insuranceFee.toFixed(2),
      };

      const createResp = await axios.post(`${backendomain.backendomain}/api/baggo/createPackage`, payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      const packageId = createResp.data?.package?._id;
      if (!packageId) throw new Error('Package ID not returned');

      console.log('Package created, redirecting to payment page:', packageId);

      if (dataUri) await AsyncStorage.setItem('packageImage', dataUri);

      const out = {
        packageId,
        travelerId: initialTraveler.id,
        travellerName: initialTraveler.name,
        travellerEmail: 'user@example.com',
        amount: total.toFixed(2),
        insurance: insurance ? 'yes' : 'no',
        insuranceCost: insuranceFee.toFixed(2),
        tripId: initialTraveler.tripId ?? '',
        image: dataUri,
      };

      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v == null ? '' : String(v)]))
      ).toString();

      router.push(`/payment?${qs}`);
    } catch (err: any) {
      console.error('Error creating package:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create package');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Request</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Traveler info */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.travelerName}>{initialTraveler.name}</Text>
            <View style={styles.dateBadge}>
              <Calendar size={14} color={Colors.primary} />
              <Text style={styles.dateText}>
                {initialTraveler.date ? new Date(initialTraveler.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.routeText}>{initialTraveler.from || (fromCity ? fromCity : '—')}</Text>
            <Text style={styles.arrow}>→</Text>
            <MapPin size={16} color={Colors.secondary} />
            <Text style={styles.routeText}>{initialTraveler.to || (toCity ? toCity : '—')}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route (From → To)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>From City</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.textMuted}
                value={fromCity}
                onChangeText={setFromCity}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>From Country (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor={Colors.textMuted}
                value={fromCountry}
                onChangeText={setFromCountry}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>To City</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.textMuted}
                value={toCity}
                onChangeText={setToCity}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>To Country (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor={Colors.textMuted}
                value={toCountry}
                onChangeText={setToCountry}
              />
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Package Weight</Text>
            <View style={styles.inputContainer}>
              <Weight size={20} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Enter weight"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textArea]}>
              <TextInput
                style={[styles.input, styles.textAreaInput]}
                placeholder="What's in the package?"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Value (optional)</Text>
            <View style={styles.inputContainer}>
            <Text style={styles.currency}>{currencySymbol}</Text>
              <TextInput
                style={styles.input}
                placeholder="Item value"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={itemValue}
                onChangeText={setItemValue}
              />
            </View>
          </View>

          <View style={styles.insuranceCard}>
            <View style={styles.insuranceHeader}>
              <Shield size={20} color={Colors.primary} />
              <Text style={styles.insuranceTitle}>Add Insurance</Text>
              <Switch
                value={insurance}
                onValueChange={setInsurance}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
            {insurance && (
              <Text style={styles.insuranceText}>2% of item value (€{insuranceFeePreview.toFixed(2)})</Text>
            )}
          </View>
        </View>

        {/* Receiver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receiver Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={Colors.textMuted}
                value={receiverName}
                onChangeText={setReceiverName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver Phone</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={receiverPhone}
                onChangeText={setReceiverPhone}
              />
            </View>
          </View>
        </View>

        {/* Package Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Package Photo (optional)</Text>
          <Text style={{ marginBottom: 8, color: Colors.textLight }}>Add one photo of the package</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.inputContainer, { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>{imagePreview ? 'Change' : 'Add Photo'}</Text>
            </TouchableOpacity>

            {imagePreview ? (
              <View style={{ marginRight: 12 }}>
                <Image source={{ uri: imagePreview }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                <TouchableOpacity
                  onPress={removeImage}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>×</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Price Breakdown (preview) */}
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Breakdown (estimate)</Text>

        {matchedPriceObj ? (
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price / kg</Text>
              <Text style={styles.priceValue}>{currencySymbol}{Number(pricePerKgUsedForPreview.toFixed(2)).toLocaleString()}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping Fee</Text>
              <Text style={styles.priceValue}>{currencySymbol}{Number(shippingFeePreview.toFixed(2)).toLocaleString()}</Text>
            </View>

        

            {insurance && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Insurance</Text>
                <Text style={styles.priceValue}>{currencySymbol}{Number(insuranceFeePreview.toFixed(2)).toLocaleString()}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>{currencySymbol}{Number(totalPreview.toFixed(2)).toLocaleString()}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: 'red', marginTop: 20 }}>No price available for this route</Text>
        )}
      </View>


        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!fromCity || !toCity || !weight || !description || !receiverName || !receiverPhone) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!fromCity || !toCity || !weight || !description || !receiverName || !receiverPhone || isLoading}
        >
          {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.continueButtonText}>Continue to Payment</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* Styles (same as your original) */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: Colors.white },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.white },
  content: { flex: 1 },
  tripCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  travelerName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontSize: 14, color: Colors.text },
  arrow: { fontSize: 14, color: Colors.textLight },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { height: 100, alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  textAreaInput: { height: 76, textAlignVertical: 'top' },
  unit: { fontSize: 15, fontWeight: '600', color: Colors.textLight },
  currency: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  insuranceCard: { backgroundColor: Colors.backgroundLight, borderRadius: 12, padding: 16, marginTop: 8 },
  insuranceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insuranceTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  insuranceText: { fontSize: 13, color: Colors.textLight, marginTop: 8, marginLeft: 28 },
  priceCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 15, color: Colors.textLight },
  priceValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 17, fontWeight: 'bold', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  continueButton: { backgroundColor: Colors.primary, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: Colors.textMuted },
  continueButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
