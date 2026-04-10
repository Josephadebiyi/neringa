import { View, ScrollView, Pressable, StyleSheet, TextInput, Dimensions, TouchableOpacity, Alert, Platform, Modal, Animated, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ChevronLeft, MapPin, Calendar as CalendarIcon, Clock, 
  ArrowRight, Search, Info, Plus, Minus, X,
  CheckCircle, ShieldCheck, FileText, Check,
  ChevronRight, ArrowUpRight, Plane, Globe, Zap
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import tripService from '../../lib/trips';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function PostTripScreen() {
  const { user } = useAuth();
  const { editId } = useLocalSearchParams();
  const [step, setStep] = useState(0); 
  const [kycPassed, setKycPassed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    capacity: 1, 
    pricePerKg: '',
    ticketPhoto: null as string | null,
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [timeHour, setTimeHour] = useState('08');
  const [timeMinute, setTimeMinute] = useState('00');
  const [timePeriod, setTimePeriod] = useState('AM');

  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());

  const handlePrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const renderCalendarGrid = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const firstDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
    const startingDayOfWeek = firstDay.getDay(); 
    const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
       days.push(<View key={`empty-${i}`} style={{ width: '13%', aspectRatio: 1 }} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
       const cellDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), i);
       const isPastDay = cellDate < today;
       const cellDateStr = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
       const isSelected = formData.date === cellDateStr;
       
       days.push(
         <TouchableOpacity 
           key={`day-${i}`} 
           disabled={isPastDay}
           style={[styles.calDayBtn, isSelected && styles.calDayBtnActive, isPastDay && { opacity: 0.3 }]}
           onPress={() => { setFormData({...formData, date: cellDateStr}); setShowCalendar(false); }}
         >
            <Text style={[styles.calDayText, isSelected && styles.calDayTextActive, isPastDay && { color: COLORS.gray300 }]}>{i}</Text>
         </TouchableOpacity>
       );
    }
    return days;
  };

  useEffect(() => {
    if (user?.isVerified) setKycPassed(true);
    if (user?.acceptedTerms) setTermsAccepted(true);

    if (editId) {
       (async () => {
         try {
            setLoading(true);
            const tripinfo = await tripService.getTripById(editId as string);
            const d = new Date(tripinfo.departureDate);
            
            // Extract time components properly
            let hours = d.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            const mins = d.getMinutes();
            
            const hourStr = hours.toString().padStart(2, '0');
            const minStr = mins.toString().padStart(2, '0');
            
            setTimeHour(hourStr);
            setTimeMinute(minStr);
            setTimePeriod(ampm);
            
            setFormData({
              ...formData,
              from: `${tripinfo.fromLocation}${tripinfo.fromCountry ? ', ' + tripinfo.fromCountry : ''}`,
              to: `${tripinfo.toLocation}${tripinfo.toCountry ? ', ' + tripinfo.toCountry : ''}`,
              date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: `${hourStr}:${minStr} ${ampm}`,
              capacity: tripinfo.availableKg,
              pricePerKg: String(tripinfo.pricePerKg),
            });
            setStep(1); 
         } catch (e: any) {
            if (!String(e).includes('token')) {
              console.warn('Failed to load existing trip data', e);
              Alert.alert('Error', 'Failed to load trip data. Please try again.');
            }
         } finally {
            setLoading(false);
         }
       })();
    } else if (user?.isVerified && user?.acceptedTerms) {
      setStep(1);
    }
  }, [editId]);

  const { acceptTerms } = useAuth();

  const nextStep = async () => {
    if (step === 0) {
      if (!kycPassed || !termsAccepted) return Alert.alert('Error', 'Please complete KYC and accept terms');
      if (!user?.acceptedTerms) {
        try {
          setLoading(true);
          await acceptTerms();
        } catch (e) {
          console.error('Failed to accept terms:', e);
        } finally {
          setLoading(false);
        }
      }
    }
    if (step === 1 && !formData.from) return Alert.alert('Error', 'Select departure city');
    if (step === 2 && !formData.to) return Alert.alert('Error', 'Select destination city');
    if (step === 3 && !formData.date) return Alert.alert('Error', 'Select travel date');
    if (step === 4 && !formData.time) return Alert.alert('Error', 'Select departure time');
    if (step === 6 && !formData.pricePerKg) return Alert.alert('Error', 'Enter price per kg');
    
    if (step < 8) setStep(step + 1);
    else handlePublish();
  };

  const prevStep = () => {
    if (editId && step === 1) {
      router.back();
    } else if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const [fromCity, fromCountry] = formData.from.split(', ');
      const [toCity, toCountry] = formData.to.split(', ');

      const submitData = {
        fromCountry: fromCountry || 'United Kingdom',
        fromLocation: fromCity || formData.from,
        toCountry: toCountry || 'Nigeria',
        toLocation: toCity || formData.to,
        departureDate: new Date(formData.date).toISOString(),
        arrivalDate: new Date(formData.date).toISOString(),
        availableKg: formData.capacity,
        pricePerKg: parseFloat(formData.pricePerKg) || 0,
        currency: 'USD', 
        travelMeans: 'Flight',
        landmark: 'Bago Pick-up Point',
        travelDocument: formData.ticketPhoto
      };

      if (editId) {
        await tripService.updateTrip(editId as string, submitData);
      } else {
        await tripService.createTrip(submitData);
      }
      setShowSuccess(true);
    } catch (error: any) {
      Alert.alert('Publish Failed', error.message || 'There was an error saving your trip.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <ComplianceStep kycPassed={kycPassed} setKycPassed={setKycPassed} accepted={termsAccepted} setAccepted={setTermsAccepted} />;
      case 1: return <LocationPicker title="Departure City" value={formData.from} onSelect={(v: string) => setFormData({...formData, from: v})} />;
      case 2: return <LocationPicker title="Destination City" value={formData.to} onSelect={(v: string) => setFormData({...formData, to: v})} />;
      case 3: return <CalendarStep value={formData.date} onOpen={() => setShowCalendar(true)} />;
      case 4: return <TimePickerStep value={formData.time} onOpen={() => setShowTimePicker(true)} />;
      case 5: return <CapacityCounter capacity={formData.capacity} onChange={(v: number) => setFormData({...formData, capacity: v})} />;
      case 6: return <PriceStep price={formData.pricePerKg} onChange={(v: string) => setFormData({...formData, pricePerKg: v})} />;
      case 7: return <TicketUploadStep photo={formData.ticketPhoto} onUpload={(uri: string) => setFormData({...formData, ticketPhoto: uri})} />;
      case 8: return <ReviewStep data={formData} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editId ? 'Edit Your Trip' : 'Post a Trip'}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, { width: `${(step / 8) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.flex}>
          {renderStep()}
        </View>
      </KeyboardAvoidingView>

      {!showSuccess && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryBtn, (loading || (step === 0 && (!kycPassed || !termsAccepted))) && styles.disabledBtn]} 
            onPress={nextStep}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Submitting...' : step === 8 ? 'Publish Trip' : 'Continue'}
            </Text>
            {!loading && <ArrowRight size={20} color={COLORS.white} />}
          </TouchableOpacity>
        </View>
      )}

      {/* CLOCK / TIME PICKER MODAL */}
      <Modal visible={showTimePicker} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
           <View style={styles.clockCard}>
              <Text style={styles.clockTitle}>Set Departure Time</Text>
              <View style={styles.clockFace}>
                 <View style={styles.clockNumbers}>
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => (
                      <Text key={n} style={[styles.clockNum, { 
                        transform: [
                          { rotate: `${i * 30}deg` }, 
                          { translateY: -80 },
                          { rotate: `-${i * 30}deg` }
                        ]
                      }]}>{n}</Text>
                    ))}
                 </View>
                 <View style={styles.clockCenter} />
                 <View style={[styles.clockHand, { transform: [{ rotate: '45deg' }] }]} />
              </View>
              <View style={styles.clockInputRow}>
                 <TextInput 
                   style={styles.clockTimeInput} 
                   value={timeHour} 
                   onChangeText={setTimeHour} 
                   keyboardType="numeric" 
                   maxLength={2} 
                 />
                 <Text style={styles.clockColon}>:</Text>
                 <TextInput 
                   style={styles.clockTimeInput} 
                   value={timeMinute} 
                   onChangeText={setTimeMinute} 
                   keyboardType="numeric" 
                   maxLength={2} 
                 />
                 <View style={styles.amPmBox}>
                    <TouchableOpacity style={timePeriod === 'AM' ? styles.amPmBtnActive : styles.amPmBtn} onPress={() => setTimePeriod('AM')}>
                       <Text style={timePeriod === 'AM' ? styles.amPmTextActive : styles.amPmText}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={timePeriod === 'PM' ? styles.amPmBtnActive : styles.amPmBtn} onPress={() => setTimePeriod('PM')}>
                       <Text style={timePeriod === 'PM' ? styles.amPmTextActive : styles.amPmText}>PM</Text>
                    </TouchableOpacity>
                 </View>
              </View>
              <TouchableOpacity style={styles.clockSubmit} onPress={() => { setFormData({...formData, time: `${timeHour}:${timeMinute} ${timePeriod}`}); setShowTimePicker(false); }}>
                 <Text style={styles.clockSubmitText}>Apply Time</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* CALENDAR MODAL (REUSED) */}
      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
           <View style={styles.calModalContent}>
              <View style={styles.calHeader}>
                 <TouchableOpacity onPress={() => setShowCalendar(false)}><X size={24} color={COLORS.black} /></TouchableOpacity>
                 <Text style={styles.calTitle}>Select Date</Text>
                 <View style={{ width: 24 }} />
              </View>

              <View style={styles.calMonthSelector}>
                <TouchableOpacity onPress={handlePrevMonth}><ChevronLeft size={24} color={COLORS.black} /></TouchableOpacity>
                <Text style={styles.calMonthText}>{currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={handleNextMonth}><ChevronRight size={24} color={COLORS.black} /></TouchableOpacity>
              </View>

              <View style={styles.calWeekRow}>
                 {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Text key={d} style={styles.calWeekDay}>{d}</Text>)}
              </View>

              <View style={styles.calendarGrid}>
                 {renderCalendarGrid()}
              </View>
           </View>
        </View>
      </Modal>

      {/* SUCCESS / PENDING MODAL */}
      <Modal visible={showSuccess} animationType="slide" transparent>
        <View style={styles.successBg}>
           <View style={styles.successCard}>
              <View style={styles.successIconBox}>
                 <View style={styles.successRipple} />
                 <CheckCircle size={80} color={COLORS.primary} />
              </View>
              <Text style={styles.successTitle}>{editId ? 'Trip Updated!' : 'Trip Published!'}</Text>
              <View style={[styles.pendingBadge, { backgroundColor: '#D1FAE5' }]}>
                 <CheckCircle size={16} color="#059669" />
                 <Text style={[styles.pendingText, { color: '#059669' }]}>STATUS: LIVE & VISIBLE</Text>
              </View>
              <Text style={styles.successDesc}>
                 Your trip to <Text style={{ fontWeight: '800' }}>{formData.to}</Text> is now live. Senders can now see your route and send you shipping proposals!
              </Text>
              
              <View style={styles.successInfoBox}>
                 <View style={styles.successInfoRow}>
                    <Globe size={20} color={COLORS.primary} />
                    <Text style={styles.successInfoText}>Visible to all Bago users</Text>
                 </View>
                 <View style={styles.successInfoRow}>
                    <Zap size={20} color={COLORS.primary} />
                    <Text style={styles.successInfoText}>Ready to receive offers</Text>
                 </View>
              </View>

              <TouchableOpacity style={styles.successFinishBtn} onPress={() => { setShowSuccess(false); router.replace('/(tabs)/trips'); }}>
                 <Text style={styles.successFinishBtnText}>Go to My Trips</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ComplianceStep({ kycPassed, setKycPassed, accepted, setAccepted }: any) {
  return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Let's start your journey.</Text>
      <Text style={styles.stepSubtitle}>Before posting, we need to verify your identity and ensure you agree to our safety and legal terms.</Text>
      <TouchableOpacity style={[styles.checkCard, kycPassed && styles.checkCardActive]} onPress={() => setKycPassed(true)}>
        <View style={styles.checkInfo}>
          <View style={styles.checkIconBox}><ShieldCheck size={24} color={kycPassed ? COLORS.primary : COLORS.gray400} /></View>
          <View>
            <Text style={styles.checkLabel}>Identity Verification (KYC)</Text>
            <Text style={styles.checkSub}>{kycPassed ? 'Verified' : 'Required to Continue'}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.termsBox}>
        <Text style={styles.termsTitle}>Community Guidelines & Terms</Text>
        <ScrollView style={styles.termsScroll} nestedScrollEnabled={true}>
          <Text style={styles.termsText}>
            As a Bago Carrier, you enter into a legally binding agreement with Bago and the Senders you connect with. {'\n\n'}
            1. Package Inspection: You MUST personally inspect the contents of any package you agree to carry. {'\n\n'}
            2. Safety & Legality: You are solely responsible for ensuring the contents are legal in both the origin and destination countries. Bago has ZERO tolerance for illegal substances or restricted items. {'\n\n'}
            3. Insurance & Value: You must respect the declared value of items and follow Bago's protection protocols. {'\n\n'}
            4. Timely Delivery: You agree to deliver items within the agreed timeframe. Any delays must be communicated immediately via the app. {'\n\n'}
            5. In-App Conduct: All negotiations, tracking, and payments must occur via the Bago platform to be protected by our escrow and insurance policies. {'\n\n'}
            6. Liability: Bago is not liable for transport-related losses beyond the insured value. You indemnify Bago against any legal claims arising from your conduct.
          </Text>
        </ScrollView>
        <Pressable style={styles.acceptRow} onPress={() => setAccepted(!accepted)}>
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted && <Check size={14} color={COLORS.white} />}
          </View>
          <Text style={styles.acceptLabel}>I accept all safety guidelines and legal terms</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

import axios from 'axios';

function LocationPicker({ title, value, onSelect }: any) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${text}&format=json&addressdetails=1&limit=8`);
      const results = response.data.map((item: any) => ({
        name: `${item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0]}, ${item.address.country}`,
        country: item.address.country,
        country_code: item.address.country_code,
      }));
      setSuggestions(results);
    } catch (err) {
      console.error('Location fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFlag = (code: string) => {
    if (!code) return '🌍';
    const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <View style={styles.searchBar}>
        <Search size={22} color={COLORS.gray400} />
        <TextInput 
          placeholder="Search city or country..." 
          style={styles.searchInput} 
          value={query || value} 
          onChangeText={fetchLocations}
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
        {suggestions.map((item, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.suggestionItem} 
            onPress={() => {
              onSelect(item.name);
              setQuery(item.name);
              setSuggestions([]);
            }}
          >
            <View style={styles.suggestionIcon}>
               <Text style={{ fontSize: 20 }}>{getFlag(item.country_code)}</Text>
            </View>
            <View style={styles.suggestionInfo}>
               <Text style={styles.suggestionName}>{item.name}</Text>
               <Text style={styles.suggestionCountry}>{item.country}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.gray300} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function CalendarStep({ value, onOpen }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Travel Date</Text>
      <Text style={styles.stepSubtitle}>When are you leaving?</Text>
      <TouchableOpacity onPress={onOpen} style={styles.mockStaticInput}>
         <CalendarIcon size={22} color={COLORS.primary} />
         <Text style={styles.mockStaticText}>{value}</Text>
      </TouchableOpacity>
    </View>
  );
}

function TimePickerStep({ value, onOpen }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Departure Time</Text>
      <Text style={styles.stepSubtitle}>What time is your flight/bus?</Text>
      <TouchableOpacity onPress={onOpen} style={styles.mockStaticInput}>
         <Clock size={22} color={COLORS.primary} />
         <Text style={styles.mockStaticText}>{value}</Text>
      </TouchableOpacity>
    </View>
  );
}

function CapacityCounter({ capacity, onChange }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.capacityTitle}>How many kilograms{'\n'}can you carry?</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => capacity > 1 && onChange(capacity - 1)}>
          <Minus size={32} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{capacity}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(capacity + 1)}>
          <Plus size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PriceStep({ price, onChange }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Set your price per KG</Text>
      <View style={styles.priceInputRow}>
        <Text style={styles.currencyPrefix}>$</Text>
        <TextInput style={styles.priceInput} placeholder="0.00" keyboardType="numeric" value={price} onChangeText={onChange} autoFocus />
        <Text style={styles.kgSuffix}>/ KG</Text>
      </View>
    </View>
  );
}

function TicketUploadStep({ photo, onUpload }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const imageData = `data:image/jpeg;base64,${asset.base64}`;
        onUpload(imageData);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Proof of Travel</Text>
      <Text style={styles.stepSubtitle}>Please upload your ticket or boarding pass</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} disabled={isUploading}>
        {isUploading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <>
            <FileText size={48} color={photo ? COLORS.primary : COLORS.gray300} />
            <Text style={styles.uploadText}>{photo ? 'Ticket Attached ✨' : 'Tap to Upload'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function ReviewStep({ data }: any) {
  return (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Publish</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewRoute}>{data.from} → {data.to}</Text>
        <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Date</Text><Text style={styles.reviewVal}>{data.date}</Text></View>
        <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Time</Text><Text style={styles.reviewVal}>{data.time}</Text></View>
        <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Capacity</Text><Text style={styles.reviewVal}>{data.capacity} KG</Text></View>
        <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Rate</Text><Text style={styles.reviewVal}>${data.pricePerKg}/KG</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: COLORS.bgSoft, 
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 10
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: COLORS.black,
    flex: 1,
    textAlign: 'center'
  },
  headerSpacer: { width: 44 },
  progressRow: { height: 4, backgroundColor: COLORS.bgSoft, borderRadius: 2, marginTop: 24, marginHorizontal: 10 },
  progressBar: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  
  stepContent: { padding: 24 },
  stepTitle: { fontSize: 28, fontWeight: '800', color: COLORS.black, lineHeight: 34, marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: COLORS.gray500, fontWeight: '600', marginBottom: 32 },

  capacityTitle: { fontSize: 30, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginTop: 40 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 60 },
  counterBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: COLORS.gray200, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 64, fontWeight: '800', color: COLORS.black, minWidth: 80, textAlign: 'center' },

  checkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, padding: 20, borderRadius: 24, marginBottom: 12 },
  checkCardActive: { backgroundColor: COLORS.primarySoft, borderWidth: 1.5, borderColor: COLORS.primary },
  checkInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  checkIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  checkSub: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },

  termsBox: { marginTop: 24 },
  termsTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black, marginBottom: 16 },
  termsScroll: { height: 160, backgroundColor: COLORS.bgSoft, borderRadius: 20, padding: 16, marginBottom: 20 },
  termsText: { fontSize: 14, color: COLORS.gray600, lineHeight: 20, fontWeight: '600' },
  acceptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.gray200, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  acceptLabel: { fontSize: 15, fontWeight: '700', color: COLORS.black },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgSoft, borderRadius: 20, height: 60, paddingHorizontal: 20, marginTop: 8 },
  searchInput: { flex: 1, fontSize: 17, color: COLORS.black, fontWeight: '700' },
  suggestionsList: { marginTop: 12, maxHeight: height * 0.4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 12 },
  suggestionIcon: { width: 44, height: 44, backgroundColor: COLORS.bgSoft, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  suggestionCountry: { fontSize: 13, color: COLORS.gray500, fontWeight: '500', marginTop: 2 },

  mockStaticInput: { height: 64, backgroundColor: COLORS.bgOff, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16, borderWidth: 1, borderColor: COLORS.gray100 },
  mockStaticText: { fontSize: 18, fontWeight: '800', color: COLORS.black },

  priceInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40 },
  currencyPrefix: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  priceInput: { fontSize: 48, fontWeight: '800', color: COLORS.black, minWidth: 100 },
  kgSuffix: { fontSize: 24, fontWeight: '800', color: COLORS.gray400 },

  uploadBox: { height: 200, backgroundColor: COLORS.bgSoft, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.gray200, alignItems: 'center', justifyContent: 'center', gap: 16 },
  uploadText: { fontSize: 16, fontWeight: '700', color: COLORS.black },

  reviewCard: { backgroundColor: COLORS.bgSoft, borderRadius: 28, padding: 24, marginBottom: 24 },
  reviewRoute: { fontSize: 20, fontWeight: '900', color: COLORS.black, marginBottom: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reviewLabel: { fontSize: 14, color: COLORS.gray500, fontWeight: '600' },
  reviewVal: { fontSize: 16, fontWeight: '800', color: COLORS.black },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: COLORS.gray100, backgroundColor: COLORS.white },
  primaryBtn: { height: 60, backgroundColor: COLORS.black, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  disabledBtn: { opacity: 0.3 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  clockCard: { backgroundColor: COLORS.white, borderRadius: 32, padding: 24, width: width - 60, alignItems: 'center' },
  clockTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black, marginBottom: 24 },
  clockFace: { width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  clockNumbers: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  clockNum: { position: 'absolute', fontSize: 16, fontWeight: '700', color: COLORS.black },
  clockCenter: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, zIndex: 10 },
  clockHand: { position: 'absolute', width: 2, height: 80, backgroundColor: COLORS.primary, top: '15%' },
  clockInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  clockTimeInput: { width: 60, height: 60, backgroundColor: COLORS.bgSoft, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '800' },
  clockColon: { fontSize: 24, fontWeight: '800' },
  amPmBox: { gap: 4 },
  amPmBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.bgSoft },
  amPmBtnActive: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.primary },
  amPmText: { fontSize: 12, fontWeight: '700', color: COLORS.gray500 },
  amPmTextActive: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  clockSubmit: { backgroundColor: COLORS.black, width: '100%', height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  clockSubmitText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },

  calModalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, marginTop: height * 0.4 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  calTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  
  calMonthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calMonthText: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  calWeekDay: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, width: '13%', textAlign: 'center' },
  
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 },
  calDayBtn: { width: '13%', aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgSoft },
  calDayBtnEmpty: { width: '13%', aspectRatio: 1 },
  calDayBtnActive: { backgroundColor: COLORS.primary },
  calDayText: { fontSize: 14, fontWeight: '700' },
  calDayTextActive: { color: COLORS.white },

  successBg: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: COLORS.white, width: width - 40, borderRadius: 40, padding: 32, alignItems: 'center' },
  successIconBox: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successRipple: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.primarySoft, opacity: 0.5 },
  successTitle: { fontSize: 28, fontWeight: '900', color: COLORS.black, marginBottom: 8 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  pendingText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  successDesc: { textAlign: 'center', fontSize: 15, color: COLORS.gray500, lineHeight: 22, marginBottom: 32 },
  successInfoBox: { width: '100%', gap: 16, marginBottom: 40 },
  successInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  successInfoText: { fontSize: 14, fontWeight: '700', color: COLORS.gray700 },
  successFinishBtn: { width: '100%', height: 64, backgroundColor: COLORS.black, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  successFinishBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
