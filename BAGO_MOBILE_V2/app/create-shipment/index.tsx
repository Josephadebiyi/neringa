import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Image, Dimensions, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ChevronLeft, Package, Sparkles, FileText, Shirt, Smartphone, Book, 
  Pill, Dumbbell, Home, Boxes, Plus, X, Camera, MapPin, Calendar, 
  ShieldCheck, ArrowRight, Info, AlertTriangle 
} from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import packageService from '../../lib/packages';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#5845D8',
  primaryLight: '#EDE9FE',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  gray900: '#111827',
  gray600: '#4B5563',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  red500: '#EF4444',
  green: '#10B981',
  gray100: '#F3F4F6',
};

const CATEGORIES = [
  { id: 'documents', icon: FileText, label: 'Documents', exam: 'Passport, Contracts' },
  { id: 'clothing', icon: Shirt, label: 'Clothing', exam: 'Shirts, Shoes' },
  { id: 'electronics', icon: Smartphone, label: 'Electronics', exam: 'Phone, Laptop' },
  { id: 'books', icon: Book, label: 'Books', exam: 'Novels, Textbook' },
  { id: 'food', icon: Package, label: 'Food', exam: 'Dry foods, Snacks' },
  { id: 'cosmetics', icon: Sparkles, label: 'Cosmetics', exam: 'Skin care, Makeup' },
  { id: 'medicine', icon: Pill, label: 'Medicine', exam: 'Prescriptions' },
  { id: 'sports', icon: Dumbbell, label: 'Sports', exam: 'Equipment' },
  { id: 'home', icon: Home, label: 'Home', exam: 'Small deco' },
  { id: 'other', icon: Boxes, label: 'Other', exam: 'Everything else' },
];

const SIZES = [
  { id: 'env', label: 'Envelope', spec: 'A4 Size', weight: '0.5kg', desc: 'Fits in pocket' },
  { id: 'small', label: 'Small Box', spec: '30x20x10cm', weight: '2kg', desc: 'Fits in backpack' },
  { id: 'med', label: 'Medium Box', spec: '50x40x30cm', weight: '10kg', desc: 'Fits in carry-on' },
  { id: 'large', label: 'Large Box', spec: '80x60x40cm', weight: '25kg', desc: 'Checked baggage' },
];

export default function CreateShipmentScreen() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' }}>
        <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Something went wrong</Text>
        <Text style={{ textAlign: 'center', color: '#4B5563', lineHeight: 22, marginBottom: 32 }}>{error}</Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#5845D8', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }} 
          onPress={() => setError(null)}
        >
           <Text style={{ color: 'white', fontWeight: '700' }}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return <CreateShipmentContent onError={(msg: string) => setError(msg)} />;
}

function CreateShipmentContent({ onError }: { onError: (msg: string) => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    size: '',
    weight: 1,
    description: '',
    declaredValue: '',
    from: '',
    to: '',
    date: 'Today',
    photos: [] as string[],
    receiverName: '',
    receiverPhone: '',
    receiverEmail: '',
  });

  const [showAgreement, setShowAgreement] = useState(false);
  const auth = useAuth();
  const { user, acceptTerms } = auth || { user: null, acceptTerms: async () => {} };

  const nextStep = () => {
    if (step === 1 && !formData.category) return Alert.alert('Error', 'Please select a category');
    if (step === 2 && !formData.size) return Alert.alert('Error', 'Please select a size');
    if (step === 3 && formData.photos.length < 3) return Alert.alert('Error', 'Please provide at least 3 photos (Overview, Label, and Sealed Package)');
    if (step === 4 && (!formData.from || !formData.to)) return Alert.alert('Error', 'Please provide both pick-up and delivery addresses');
    if (step === 4 && (!formData.receiverName || !formData.receiverPhone)) return Alert.alert('Error', 'Please provide receiver name and phone number');
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleFinishAttempt = () => {
    if (!user?.acceptedTerms) {
      setShowAgreement(true);
    } else {
      handleFinish();
    }
  };

  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!formData.from || !formData.to) {
        throw new Error('Pick-up and delivery addresses are required.');
      }

      const fromParts = formData.from.split(', ');
      const fromCity = fromParts[0] || formData.from;
      const fromCountry = fromParts[1] || 'Nigeria';

      const toParts = formData.to.split(', ');
      const toCity = toParts[0] || formData.to;
      const toCountry = toParts[1] || 'United Kingdom';

      await packageService.createPackage({
        title: `${formData.category || 'Package'} Shipping`,
        description: formData.description || `Sending ${formData.category || 'package'} from ${fromCity} up to ${formData.weight}kg`,
        weight: formData.weight,
        packageWeight: formData.weight,
        category: formData.category || 'other',
        value: parseFloat(formData.declaredValue) || 10,
        fromCity,
        fromCountry,
        toCity,
        toCountry,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        receiverEmail: formData.receiverEmail,
        images: formData.photos
      } as any);

      Alert.alert('Success', 'Your shipment request has been posted!');
      router.replace('/(tabs)/shipments');
    } catch (e: any) {
      console.error('Shipment creation failed:', e);
      Alert.alert('Post Failed', e.message || 'There was an error creating your shipment');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 formData={formData} setFormData={setFormData} />;
      case 2: return <Step2 formData={formData} setFormData={setFormData} />;
      case 3: return <Step3 formData={formData} setFormData={setFormData} />;
      case 4: return <Step4 formData={formData} setFormData={setFormData} />;
      case 5: return <Step5 formData={formData} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={prevStep} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Shipment</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={step === 5 ? handleFinishAttempt : nextStep}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Posting...' : step === 5 ? 'Confirm & Post' : 'Continue'}
          </Text>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <ArrowRight size={20} color={COLORS.white} />}
        </TouchableOpacity>
      </View>

      <Modal visible={showAgreement} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.agreementFullContainer}>
          <View style={styles.agreementFullHeader}>
            <TouchableOpacity onPress={() => setShowAgreement(false)}><X size={24} color={COLORS.gray900} /></TouchableOpacity>
            <View style={styles.logoRow}>
               <Image source={require('../../assets/bago-logo.png')} style={styles.miniLogo} resizeMode="contain" />
               <Text style={styles.agreementFullTitle}>Escrow Security & Policy</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.agreementScroll} showsVerticalScrollIndicator={true}>
            <View style={styles.agreementContent}>
              <Text style={styles.legalSectionTitle}>1. Bago Escrow Security</Text>
              <Text style={styles.legalText}>
                Bago protects your payments. Funds are only released to the traveler once you confirm delivery of the item. This ensures that you get what you paid for and the traveler is compensated for their service fairly.
              </Text>
              
              <Text style={styles.legalSectionTitle}>2. Insurance & Protection</Text>
              <Text style={styles.legalText}>
                Every shipment on Bago is eligible for "Bago Care" protection. Your package is insured up to $500 for loss or damage during transit, subject to provided photographic evidence during the pickup phase. To claim insurance, ensure you have a valid Shipping Label/Customs Declaration PDF.
              </Text>

              <View style={styles.legalDivider} />

              <Text style={styles.legalSectionTitle}>3. Prohibited Items</Text>
              <Text style={styles.legalText}>
                By proceeding, you certify that the items being shipped do not include:
                {"\n"}• Narcotics, illegal drugs, or controlled substances
                {"\n"}• Weapons, ammunition, or explosives
                {"\n"}• Flammable liquids or hazardous materials
                {"\n"}• Counterfeit currency or documents
              </Text>

              <Text style={styles.legalSectionTitle}>4. Customs Declaration</Text>
              <Text style={styles.legalText}>
                The information provided in this shipment form will be used to generate your Shipping Label and Customs Declaration PDF. Misrepresenting item value or contents can lead to legal penalties and denial of insurance claims.
              </Text>

              <View style={styles.pageBreak}>
                 <Text style={styles.pageBreakText}>Page 1 of 2 — End of Security Policy</Text>
              </View>

              <Text style={styles.legalSectionTitle}>5. Traveler Responsibilities</Text>
              <Text style={styles.legalText}>
                Travelers are responsible for the physical safety of your package. They must verify the contents at pickup and provide proof of delivery.
              </Text>
              
              <Text style={styles.pageBreakText}>Page 2 of 2 — Agreement Summary</Text>
            </View>
          </ScrollView>

          <View style={styles.agreementFooter}>
            <TouchableOpacity 
              style={styles.agreementConfirmBtn} 
              onPress={async () => { 
                await acceptTerms(); 
                setShowAgreement(false); 
                handleFinish(); 
              }}
            >
              <Text style={styles.agreementConfirmBtnText}>I Read & Accept Terms</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Step1({ formData, setFormData }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What are you sending?</Text>
      <Text style={styles.stepSubtitle}>Select a category that best describes your item</Text>
      
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Pressable 
            key={cat.id} 
            onPress={() => setFormData({ ...formData, category: cat.id })}
            style={[styles.gridItem, formData.category === cat.id && styles.gridItemActive]}
          >
            <View style={[styles.iconBg, formData.category === cat.id && styles.iconBgActive]}>
              <cat.icon size={28} color={formData.category === cat.id ? COLORS.white : COLORS.primary} />
            </View>
            <Text style={[styles.catLabel, formData.category === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <View style={styles.restrictedWarning}>
        <AlertTriangle size={20} color={COLORS.red500} />
        <Text style={styles.warningText}>
          Ensure your item is not prohibited. No weapons, drugs, or flammables.
        </Text>
      </View>
    </View>
  );
}

function Step2({ formData, setFormData }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Package Size</Text>
      <Text style={styles.stepSubtitle}>Choose the size and provide weight details</Text>
      
      <View style={styles.sizeList}>
        {SIZES.map((size) => (
          <Pressable 
            key={size.id}
            onPress={() => setFormData({ ...formData, size: size.id })}
            style={[styles.sizeItem, formData.size === size.id && styles.sizeItemActive]}
          >
            <View style={styles.sizeInfo}>
              <Text style={styles.sizeLabel}>{size.label}</Text>
              <Text style={styles.sizeSpec}>{size.spec} • Max {size.weight}</Text>
              <Text style={styles.sizeDesc}>{size.desc}</Text>
            </View>
            <View style={[styles.radioCircle, formData.size === size.id && styles.radioActive]} />
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Estimated Weight (kg)</Text>
      <View style={styles.weightStepper}>
        <Pressable 
          onPress={() => setFormData({ ...formData, weight: Math.max(0.5, formData.weight - 0.5) })}
          style={styles.stepperButton}
        >
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <Text style={styles.weightValue}>{formData.weight} kg</Text>
        <Pressable 
          onPress={() => setFormData({ ...formData, weight: formData.weight + 0.5 })}
          style={styles.stepperButton}
        >
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Step3({ formData, setFormData }: any) {
  const handlePhotoUpdate = (index: number, uri: string) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = uri;
    setFormData({ ...formData, photos: newPhotos });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Package Photos</Text>
      <Text style={styles.stepSubtitle}>Take clear photos for shipment protection</Text>
      
      <View style={styles.photoGrid}>
        <PhotoSlot label="Overview" required photo={formData.photos[0]} onPhoto={(uri: string) => handlePhotoUpdate(0, uri)} />
        <PhotoSlot label="Label/Address" required photo={formData.photos[1]} onPhoto={(uri: string) => handlePhotoUpdate(1, uri)} />
        <PhotoSlot label="Contents" optional photo={formData.photos[2]} onPhoto={(uri: string) => handlePhotoUpdate(2, uri)} />
        <PhotoSlot label="Sealed Package" required photo={formData.photos[3]} onPhoto={(uri: string) => handlePhotoUpdate(3, uri)} />
      </View>

      <View style={styles.instructionCard}>
        <Info size={20} color={COLORS.primary} />
        <Text style={styles.instructionText}>
          Good lighting and a sharp focus help us verify your package faster.
        </Text>
      </View>
    </View>
  );
}

function Step4({ formData, setFormData }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where and When?</Text>
      <Text style={styles.stepSubtitle}>Set your route details and timing</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pickup From</Text>
        <View style={styles.inputWrap}>
          <MapPin size={20} color={COLORS.primary} />
          <TextInput 
            placeholder="Search address" 
            style={styles.input}
            value={formData.from}
            onChangeText={(t) => setFormData({ ...formData, from: t })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Deliver To</Text>
        <View style={styles.inputWrap}>
          <MapPin size={20} color={COLORS.green} />
          <TextInput 
            placeholder="Search address" 
            style={styles.input}
            value={formData.to}
            onChangeText={(t) => setFormData({ ...formData, to: t })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Departure Date</Text>
        <View style={styles.inputWrap}>
          <Calendar size={20} color={COLORS.gray600} />
          <Text style={styles.input}>{formData.date}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Receiver Full Name *</Text>
        <TextInput 
          style={styles.inputClean} 
          placeholder="Who is receiving this?" 
          value={formData.receiverName}
          onChangeText={(v) => setFormData({...formData, receiverName: v})}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Receiver Phone Number *</Text>
        <TextInput 
          style={styles.inputClean} 
          placeholder="+234..." 
          keyboardType="phone-pad"
          value={formData.receiverPhone}
          onChangeText={(v) => setFormData({...formData, receiverPhone: v})}
        />
      </View>
    </View>
  );
}

function Step5({ formData }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <Text style={styles.stepSubtitle}>Check details before posting your shipment</Text>
      
      <View style={styles.reviewCard}>
        <ReviewItem label="Category" value={formData.category} icon={<Package size={18} color={COLORS.primary} />} />
        <ReviewItem label="Size" value={formData.size} icon={<Boxes size={18} color={COLORS.primary} />} />
        <ReviewItem label="Weight" value={`${formData.weight} kg`} icon={<Info size={18} color={COLORS.primary} />} />
        <View style={styles.divider} />
        <ReviewItem label="From" value={formData.from || 'Not specified'} icon={<MapPin size={18} color={COLORS.primary} />} />
        <ReviewItem label="To" value={formData.to || 'Not specified'} icon={<MapPin size={18} color={COLORS.green} />} />
      </View>

      <View style={styles.insuranceBox}>
        <ShieldCheck size={24} color={COLORS.primary} />
        <View style={styles.insuranceText}>
          <Text style={styles.insuranceTitle}>Insurance Included</Text>
          <Text style={styles.insuranceSubtitle}>Your package is protected up to $500</Text>
        </View>
      </View>
    </View>
  );
}

function PhotoSlot({ label, required, optional, photo, onPhoto }: any) {
  const [isPicking, setIsPicking] = useState(false);

  const handlePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onPhoto(uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  return (
    <Pressable style={[styles.photoSlot, photo && { borderStyle: 'solid', borderColor: COLORS.primary }]} onPress={handlePick}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.slotImage} />
      ) : (
        <>
          <View style={styles.cameraIconBg}>
            <Camera size={24} color={COLORS.gray400} />
          </View>
          <Text style={styles.photoLabel}>{label}</Text>
          {required && <Text style={styles.requiredBadge}>Required</Text>}
          {optional && <Text style={styles.optionalBadge}>Optional</Text>}
        </>
      )}
    </Pressable>
  );
}

function ReviewItem({ label, value, icon }: any) {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        {icon}
        <Text style={styles.reviewLabel}>{label}</Text>
      </View>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
    marginTop: -40,
  },
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    paddingTop: 30,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.gray600,
    marginTop: 8,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 30,
  },
  gridItem: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconBgActive: {
    backgroundColor: COLORS.primary,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  catLabelActive: {
    color: COLORS.gray900,
  },
  restrictedWarning: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    gap: 12,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  sizeList: {
    marginTop: 24,
    gap: 12,
  },
  sizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  sizeInfo: {
    flex: 1,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  sizeSpec: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  sizeDesc: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  radioActive: {
    borderColor: COLORS.primary,
    borderWidth: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  weightStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 12,
  },
  stepperButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  stepperText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  weightValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  photoSlot: {
    width: (width - 60) / 2,
    height: 160,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed' as any,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  slotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  cameraIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    textAlign: 'center',
  },
  requiredBadge: {
    fontSize: 10,
    color: COLORS.red500,
    fontWeight: '700',
    marginTop: 4,
  },
  optionalBadge: {
    fontSize: 10,
    color: COLORS.gray400,
    fontWeight: '700',
    marginTop: 4,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
    marginTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray900,
  },
  inputClean: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    fontSize: 16,
    color: COLORS.gray900,
  },
  reviewCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    gap: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  reviewValue: {
    fontSize: 14,
    color: COLORS.gray900,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },
  insuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    gap: 16,
  },
  insuranceText: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
  },
  insuranceSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  agreementFullContainer: { flex: 1, backgroundColor: COLORS.white },
  agreementFullHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLogo: { width: 60, height: 24 },
  agreementFullTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gray900, textTransform: 'uppercase', letterSpacing: 0.5 },
  agreementScroll: { flex: 1 },
  agreementContent: { padding: 24 },
  legalSectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, marginTop: 24, marginBottom: 12 },
  legalText: { fontSize: 14, color: COLORS.gray600, lineHeight: 22, marginBottom: 16 },
  legalDivider: { height: 1, backgroundColor: COLORS.gray200, marginVertical: 24 },
  pageBreak: { paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.gray100, borderStyle: 'dashed' },
  pageBreakText: { fontSize: 12, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  agreementFooter: { padding: 24, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  agreementConfirmBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  agreementConfirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  nextButtonText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
});
