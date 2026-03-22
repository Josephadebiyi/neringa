import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Image, Dimensions, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, ArrowLeft, Package, Sparkles, 
  MapPin, CheckCircle, ArrowRight, ShieldCheck,
  Camera, User, Mail, Navigation, Info, X,
  Shield, CreditCard, Plus, Minus
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import paymentService from '../../lib/payment';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'docs', label: 'Documents', icon: <Package size={24} color={COLORS.primary} /> },
  { id: 'clothes', label: 'Clothing', icon: <Package size={24} color={COLORS.primary} /> },
  { id: 'tech', label: 'Electronics', icon: <Package size={24} color={COLORS.primary} /> },
  { id: 'food', label: 'Dry Foods', icon: <Package size={24} color={COLORS.primary} /> },
];

export default function RequestShipmentScreen() {
  const params = useLocalSearchParams();
  const { id } = params; // Trip ID
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Financial States
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'USD');
  const [trip, setTrip] = useState<any>(null);
  const [fees, setFees] = useState({
    shipping: 0,
    insurance: 0,
    escrow: 5.00,
    total: 0,
    ratePerKg: 25.00 // Default, will be updated from trip
  });

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    declaredValue: '',
    size: 'Small Box',
    weight: 1, // KG
    photo: null as string | null,
    receiverName: '',
    receiverAddress: '',
    receiverEmail: '',
    protected: false,
    paymentMethod: 'visa_4242'
  });

  // Dynamic Pricing Calculation
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await api.get(`/api/bago/trips/${id}`);
        const tripData = response.data.trip;
        setTrip(tripData);
        if (tripData?.pricePerKg) {
          setFees(f => ({ ...f, ratePerKg: tripData.pricePerKg }));
        }
      } catch (e) {
        console.error('Error fetching trip:', e);
      }
    };
    if (id) fetchTrip();
  }, [id]);

  useEffect(() => {
    updateQuotes();
  }, [formData.weight, formData.declaredValue, formData.protected, currency, trip]);

  const updateQuotes = async () => {
    // If we're on the summary step or need live quotes
    const value = parseFloat(formData.declaredValue || '0');
    
    // 1. Get base shipping fee from trip (usually in USD or Trip Currency)
    const tripCurrency = trip?.currency || 'USD';
    let baseShipFee = formData.weight * (trip?.pricePerKg || fees.ratePerKg);
    
    // Convert base shipping fee to user's preferred currency if they differ
    let shipFee = baseShipFee;
    if (tripCurrency !== currency) {
      try {
        const conv = await paymentService.convertCurrency({ amount: baseShipFee, from: tripCurrency, to: currency });
        shipFee = conv.conversion.convertedAmount;
      } catch (e) {
        // Simple approximation fallback if converter fails
        if (currency === 'NGN' && tripCurrency === 'USD') shipFee = baseShipFee * 1600;
        else if (currency === 'USD' && tripCurrency === 'NGN') shipFee = baseShipFee / 1600;
      }
    }
    
    // 2. Calculate Insurance
    let insFee = 0;
    if (formData.protected && value > 0) {
      try {
        const ins = await paymentService.calculateInsurance({
           itemValue: value,
           currency: currency,
           region: 'global'
        });
        insFee = ins.insurance.cost;
      } catch {
        insFee = 0; 
      }
    }

    // 3. Escrow Fee (fixed $5 base)
    let escrowFee = 5.0;
    if (currency !== 'USD') {
      try {
        const conv = await paymentService.convertCurrency({ amount: 5, from: 'USD', to: currency });
        escrowFee = conv.conversion.convertedAmount;
      } catch {
        escrowFee = currency === 'NGN' ? 8000 : 5.0;
      }
    }

    setFees({
      ...fees,
      shipping: shipFee,
      insurance: insFee,
      escrow: escrowFee,
      total: shipFee + insFee + escrowFee
    });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.category || !formData.declaredValue)) return Alert.alert('Error', 'Please describe your item');
    if (step === 4 && (!formData.receiverName || !formData.receiverAddress)) return Alert.alert('Error', 'Please fill receiver details');
    if (step < 5) setStep(step + 1);
    else handlePayment();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handlePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Payment Successful', 'Your shipment request has been sent and funds are secured in escrow.', [
        { text: 'Continue', onPress: () => router.replace('/order-success') }
      ]);
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <ItemStep data={formData} currency={currency} update={(v: any) => setFormData({...formData, ...v})} />;
      case 2: return <SizeStep data={formData} update={(v: any) => setFormData({...formData, ...v})} />;
      case 3: return <PhotoStep data={formData} update={(v: string) => setFormData({...formData, photo: v})} />;
      case 4: return <ReceiverStep data={formData} update={(v: any) => setFormData({...formData, ...v})} />;
      case 5: return <ConfirmPay data={formData} fees={fees} currencySymbol={currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'} update={(v: any) => setFormData({...formData, ...v})} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Request</Text>
        <View style={styles.progressRow}>
           <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
          <Text style={styles.buttonText}>{step === 5 ? 'Secured Payment' : 'Continue'}</Text>
          <ArrowRight size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ItemStep({ data, currency, update }: any) {
  const currencySymbol = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  
  return (
    <View style={styles.stepBox}>
      <Text style={styles.stepTitle}>What are you{'\n'}sending?</Text>
      <Text style={styles.stepSubtitle}>Provide details about your item. We support local & international shipping.</Text>
      
      {/* Show active currency preference */}
      <View style={styles.activeCurrencyBadge}>
         <Text style={styles.activeCurrencyText}>Pricing in {currency}</Text>
      </View>

      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.catCard, data.category === cat.id && styles.catCardActive]}
            onPress={() => update({ category: cat.id })}
          >
            {cat.icon}
            <Text style={[styles.catLabel, data.category === cat.id && styles.catLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Item Description</Text>
        <TextInput 
          style={styles.textArea}
          placeholder="e.g. 2 pairs of sneakers, new in box"
          multiline
          value={data.description}
          onChangeText={(v) => update({ description: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Declared Value ({currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : '$'})</Text>
        <TextInput 
          style={styles.textInput} 
          placeholder="0.00" 
          keyboardType="numeric"
          value={data.declaredValue}
          onChangeText={(v) => update({ declaredValue: v })}
        />
      </View>
    </View>
  );
}

function SizeStep({ data, update }: any) {
  return (
    <View style={styles.stepBox}>
      <Text style={styles.stepTitle}>Package Details</Text>
      
      <Text style={styles.inputLabel}>Select Weight (KG)</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => data.weight > 1 && update({ weight: data.weight - 1 })}>
          <Minus size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{data.weight} KG</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={() => update({ weight: data.weight + 1 })}>
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.sizeSection}>
        <Text style={styles.inputLabel}>Estimated Size</Text>
        {['Envelope', 'Small Box', 'Medium Box', 'Large Case'].map(s => (
          <TouchableOpacity 
            key={s} 
            style={[styles.sizeItem, data.size === s && styles.sizeItemActive]}
            onPress={() => update({ size: s })}
          >
            <View style={[styles.radioCircle, data.size === s && styles.radioCircleActive]} />
            <Text style={styles.sizeLabel}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PhotoStep({ data, update }: any) {
  return (
    <View style={styles.stepBox}>
      <Text style={styles.stepTitle}>Item Photo</Text>
      <Text style={styles.stepSubtitle}>Carriers must see the item they are carrying for safety.</Text>
      
      <Pressable style={styles.uploadBtn} onPress={() => update('mock-uri')}>
        <View style={styles.uploadIconCircle}>
           <Camera size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.uploadText}>{data.photo ? 'Photo Attached' : 'Take a Photo'}</Text>
      </Pressable>
    </View>
  );
}

function ReceiverStep({ data, update }: any) {
  return (
    <View style={styles.stepBox}>
      <Text style={styles.stepTitle}>Who is receiving it?</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Receiver Full Name</Text>
        <TextInput style={styles.textInput} value={data.receiverName} onChangeText={(v) => update({ receiverName: v })} />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Contact Phone / Email</Text>
        <TextInput style={styles.textInput} value={data.receiverEmail} onChangeText={(v) => update({ receiverEmail: v })} />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Delivery Address</Text>
        <TextInput style={styles.textInput} value={data.receiverAddress} onChangeText={(v) => update({ receiverAddress: v })} />
      </View>
    </View>
  );
}

function ConfirmPay({ data, fees, currencySymbol, update }: any) {
  return (
    <View style={styles.stepBox}>
      <Text style={styles.stepTitle}>Review & Secure</Text>
      
      {/* Insurance Toggle */}
      <View style={styles.insuranceCard}>
        <View style={styles.insuranceInfo}>
          <Shield size={24} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.insuranceTitle}>Protect your shipment</Text>
            <Text style={styles.insuranceDesc}>5% of value protects against loss.</Text>
          </View>
        </View>
        <Switch 
          value={data.protected} 
          onValueChange={(v) => update({ protected: v })} 
          trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
        />
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Shipping ({data.weight}kg × {currencySymbol}{fees.ratePerKg})</Text>
          <Text style={styles.summaryVal}>{currencySymbol}{fees.shipping.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Escrow Protection Fee</Text>
          <Text style={styles.summaryVal}>{currencySymbol}{fees.escrow.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Insurance Coverage</Text>
          <Text style={[styles.summaryVal, { color: COLORS.primary }]}>{currencySymbol}{fees.insurance.toFixed(2)}</Text>
        </View>
        <View style={styles.totalLine} />
        <View style={styles.summaryItem}>
          <Text style={styles.totalLabel}>Total Payment</Text>
          <Text style={styles.totalVal}>{currencySymbol}{fees.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment Selection */}
      <View style={styles.paymentSection}>
         <Text style={styles.inputLabel}>Pay with</Text>
         <TouchableOpacity style={styles.paymentMethodBtn} onPress={() => router.push('/profile/payment-methods')}>
            <View style={styles.paymentMethodLeft}>
               <CreditCard size={20} color={COLORS.gray600} />
               <Text style={styles.methodLabel}>Visa **** 4242</Text>
            </View>
            <Text style={styles.methodChange}>Change</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.escrowAdvice}>
        <ShieldCheck size={18} color={COLORS.primary} />
        <Text style={styles.escrowAdviceText}>Bago Escrow secures your funds until the receiver confirms delivery.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { padding: 20, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginTop: -32 },
  progressRow: { height: 4, backgroundColor: COLORS.bgSoft, borderRadius: 2, marginTop: 24 },
  progressBar: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  
  scrollContent: { padding: 24, paddingBottom: 120 },
  stepBox: { flex: 1 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: COLORS.black, lineHeight: 32, marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: COLORS.gray500, lineHeight: 22, fontWeight: '600', marginBottom: 28 },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  currencyRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  currencyBtn: { flex: 1, height: 48, borderRadius: 16, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.gray100 },
  currencyBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyLabel: { fontSize: 13, fontWeight: '800', color: COLORS.black },
  currencyLabelActive: { color: COLORS.white },
  
  catCard: { width: (width - 60) / 2, backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: COLORS.gray100 },
  catCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catLabel: { fontSize: 14, fontWeight: '800', color: COLORS.black, marginTop: 12 },
  catLabelActive: { color: COLORS.white },
  
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  textInput: { backgroundColor: COLORS.bgSoft, borderRadius: 16, height: 60, paddingHorizontal: 20, fontSize: 16, color: COLORS.black, fontWeight: '800' },
  textArea: { backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 20, height: 120, textAlignVertical: 'top', fontSize: 16, color: COLORS.black, fontWeight: '700' },
  
  counterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 12, marginBottom: 32 },
  counterBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  counterValue: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.black, textAlign: 'center' },

  sizeSection: { gap: 10 },
  sizeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 18, borderRadius: 20, gap: 16, borderWidth: 1.5, borderColor: COLORS.gray100 },
  sizeItemActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.gray200 },
  radioCircleActive: { borderColor: COLORS.primary, borderWidth: 7 },
  sizeLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  
  uploadBtn: { height: 160, borderRadius: 28, backgroundColor: COLORS.bgSoft, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.gray200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  uploadIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 15, fontWeight: '800', color: COLORS.black },

  insuranceCard: { backgroundColor: COLORS.bgOff, padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderWidth: 1, borderColor: COLORS.gray100 },
  insuranceInfo: { flexDirection: 'row', gap: 14, flex: 1 },
  insuranceTitle: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  insuranceDesc: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginTop: 2 },
  
  summaryBox: { backgroundColor: COLORS.white, borderRadius: 28, padding: 24, borderWidth: 1.5, borderColor: COLORS.gray100, marginBottom: 32 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: COLORS.gray500, fontWeight: '700' },
  summaryVal: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  totalLine: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 12 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  totalVal: { fontSize: 28, fontWeight: '900', color: COLORS.primary },

  paymentSection: { marginBottom: 32 },
  paymentMethodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 18 },
  paymentMethodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  methodChange: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  activeCurrencyBadge: { backgroundColor: COLORS.primarySoft, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 24, alignSelf: 'flex-start' },
  activeCurrencyText: { fontSize: 13, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  escrowAdvice: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.primarySoft, padding: 16, borderRadius: 20, alignItems: 'center' },
  escrowAdviceText: { flex: 1, fontSize: 13, color: COLORS.black, fontWeight: '700', lineHeight: 18 },

  footer: { padding: 24, paddingBottom: 34, borderTopWidth: 1, borderTopColor: COLORS.gray100, backgroundColor: COLORS.white },
  primaryButton: { height: 60, backgroundColor: COLORS.black, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
});
