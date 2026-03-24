import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Check, User, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function EditDetailsScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: (user as any)?.dob || '1990-01-01',
  });

  const isVerified = user?.isVerified;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        // dob: formData.dob, // Assuming dob is supported or handled
      } as any);
      Alert.alert('Success', 'Profile details updated successfully');
      handleBack();
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'There was an error updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.kycNotice}>
           <ShieldCheck size={20} color={isVerified ? COLORS.primary : COLORS.gray400} />
           <Text style={[styles.kycNoticeText, isVerified && { color: COLORS.primary }]}>
             {isVerified ? 'PROFILE VERIFIED' : 'KYC PENDING'}
           </Text>
        </View>

        <Text style={styles.label}>FIRST NAME</Text>
        <View style={[styles.inputWrap, isVerified && styles.inputDisabled]}>
          <User size={20} color={isVerified ? COLORS.gray400 : COLORS.primary} />
          <TextInput 
            style={styles.input}
            value={formData.firstName}
            onChangeText={(v) => setFormData({...formData, firstName: v})}
            editable={!isVerified}
          />
          {isVerified && <Check size={16} color={COLORS.primary} />}
        </View>

        <Text style={styles.label}>LAST NAME</Text>
        <View style={[styles.inputWrap, isVerified && styles.inputDisabled]}>
          <User size={20} color={isVerified ? COLORS.gray400 : COLORS.primary} />
          <TextInput 
            style={styles.input}
            value={formData.lastName}
            onChangeText={(v) => setFormData({...formData, lastName: v})}
            editable={!isVerified}
          />
          {isVerified && <Check size={16} color={COLORS.primary} />}
        </View>

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <View style={[styles.inputWrap, styles.inputDisabled]}>
          <Mail size={20} color={COLORS.gray400} />
          <TextInput 
            style={styles.input}
            value={formData.email}
            editable={false}
          />
          <Check size={16} color={COLORS.accentLime} />
        </View>

        <Text style={styles.label}>PHONE NUMBER</Text>
        <View style={styles.inputWrap}>
          <Phone size={20} color={COLORS.primary} />
          <TextInput 
            style={styles.input}
            value={formData.phone}
            onChangeText={(v) => setFormData({...formData, phone: v})}
          />
        </View>

        <Text style={styles.label}>DATE OF BIRTH</Text>
        <View style={[styles.inputWrap, isVerified && styles.inputDisabled]}>
          <Calendar size={20} color={isVerified ? COLORS.gray400 : COLORS.primary} />
          <TextInput 
            style={styles.input}
            value={formData.dob}
            onChangeText={(v) => setFormData({...formData, dob: v})}
            editable={!isVerified}
            placeholder="YYYY-MM-DD"
          />
          {isVerified && <Check size={16} color={COLORS.primary} />}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {isVerified 
              ? "Verified identity fields cannot be modified. Contact support if you need to update them." 
              : "Ensure your details match your ID. You won't be able to edit these after verification."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  saveText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  content: { padding: 24 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 10, marginTop: 24 },
  inputWrap: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSoft, 
    borderRadius: 16, paddingHorizontal: 16, height: 60, gap: 12 
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.black },
  inputDisabled: { opacity: 0.7, backgroundColor: COLORS.bgSoft },
  kycNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: COLORS.bgSoft, borderRadius: 12, marginBottom: 16 },
  kycNoticeText: { fontSize: 12, fontWeight: '800', color: COLORS.gray400 },
  infoBox: { marginTop: 40, padding: 16, backgroundColor: COLORS.primarySoft, borderRadius: 16 },
  infoText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});
