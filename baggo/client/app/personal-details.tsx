import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
   Image,
   KeyboardAvoidingView,
   Platform,
   Modal
} from 'react-native';
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { User, Mail, Phone, MapPin, Calendar, Save, Lock, X, Camera } from 'lucide-react-native';
import api from '@/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

// Preset avatar colors and styles
const AVATAR_PRESETS = [
  { id: 1, bgColor: '#6366F1', emoji: '👤' }, // Purple - Default
  { id: 2, bgColor: '#EC4899', emoji: '🦊' }, // Pink - Fox
  { id: 3, bgColor: '#10B981', emoji: '🐢' }, // Green - Turtle
  { id: 4, bgColor: '#F59E0B', emoji: '🦁' }, // Orange - Lion
  { id: 5, bgColor: '#3B82F6', emoji: '🐳' }, // Blue - Whale
  { id: 6, bgColor: '#8B5CF6', emoji: '🦄' }, // Violet - Unicorn
];

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kycStatus, setKycStatus] = useState('not_started');
  const [isKycLocked, setIsKycLocked] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/baggo/Profile');
        const data = response.data;
        
        if (data?.data?.findUser) {
          const user = data.data.findUser;
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
          setDateOfBirth(user.dateOfBirth || '');
          setCountry(user.country || '');
          setProfileImage(user.image ? { uri: user.image } : null);
          setKycStatus(user.kycStatus || 'not_started');
          
          // Lock fields if KYC is approved
          setIsKycLocked(user.kycStatus === 'approved');
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          router.replace('/auth/signin');
          return;
        }
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result || result.canceled || result.cancelled) return;

      const uri = result?.assets?.[0]?.uri ?? result?.uri;
      setProfileImage({ uri });

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileUri = manipResult.uri.startsWith("file://")
        ? manipResult.uri
        : `file://${manipResult.uri}`;

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload the image using api interceptor
      const res = await api.post('/api/baggo/user/image', {
        image: `data:image/jpeg;base64,${base64}`,
      });

      const data = res.data;

      if (data.success) {
        Alert.alert("Success", "Profile image updated!");
        setProfileImage({ uri: data.image });
      } else {
        Alert.alert("Error", data.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("Image upload error:", err);
      Alert.alert("Error", err.message || "Failed to upload image");
    }
  };

  const handleSave = async () => {
    try {
      const updates: any = { email, phone };
      
      // Only include name/DOB if NOT KYC locked
      if (!isKycLocked) {
        updates.firstName = firstName;
        updates.lastName = lastName;
        updates.dateOfBirth = dateOfBirth;
      }
      
      const response = await api.put('/api/baggo/edit', updates);
      const data = response.data;

      if (data.status === 'success') {
        Alert.alert('Success', 'Profile updated successfully!');
        router.push({
          pathname: '/profile',
          params: { updatedUser: JSON.stringify(data.data) },
        });
      } else {
        Alert.alert('Error', data.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Error during update API call:', err);
      if (err?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/auth/signin');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* KYC Lock Notice */}
          {isKycLocked && (
            <View style={styles.kycNotice}>
              <Lock size={18} color="#F59E0B" />
              <Text style={styles.kycNoticeText}>
                Name and Date of Birth are locked after KYC verification
              </Text>
            </View>
          )}

          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {profileImage?.uri ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <User size={48} color={Colors.white} />
              )}
            </View>
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* First Name - Locked if KYC approved */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>First Name</Text>
                {isKycLocked && <Lock size={14} color={Colors.textLight} />}
              </View>
              <View style={[styles.inputContainer, isKycLocked && styles.inputLocked]}>
                <User size={20} color={Colors.textLight} />
                <TextInput
                  style={[styles.input, isKycLocked && styles.inputTextLocked]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={Colors.textMuted}
                  editable={!isKycLocked}
                />
              </View>
            </View>

            {/* Last Name - Locked if KYC approved */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Last Name</Text>
                {isKycLocked && <Lock size={14} color={Colors.textLight} />}
              </View>
              <View style={[styles.inputContainer, isKycLocked && styles.inputLocked]}>
                <User size={20} color={Colors.textLight} />
                <TextInput
                  style={[styles.input, isKycLocked && styles.inputTextLocked]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={Colors.textMuted}
                  editable={!isKycLocked}
                />
              </View>
            </View>

            {/* Email - Always editable */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Phone - Always editable */}
            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Birth - Locked if KYC approved */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Date of Birth</Text>
                {isKycLocked && <Lock size={14} color={Colors.textLight} />}
              </View>
              <View style={[styles.inputContainer, isKycLocked && styles.inputLocked]}>
                <Calendar size={20} color={Colors.textLight} />
                <TextInput
                  style={[styles.input, isKycLocked && styles.inputTextLocked]}
                  value={formatDate(dateOfBirth)}
                  onChangeText={setDateOfBirth}
                  placeholder="Date of Birth"
                  placeholderTextColor={Colors.textMuted}
                  editable={!isKycLocked}
                />
              </View>
            </View>

            {/* Country - Read only */}
            {country && (
              <View style={styles.field}>
                <Text style={styles.label}>Country</Text>
                <View style={[styles.inputContainer, styles.inputLocked]}>
                  <MapPin size={20} color={Colors.textLight} />
                  <Text style={[styles.input, styles.inputTextLocked]}>{country}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  },
  kycNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    gap: 8,
  },
  kycNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  form: {
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLocked: {
    backgroundColor: '#F3F4F6',
    opacity: 0.8,
  },
  textAreaContainer: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  inputTextLocked: {
    color: Colors.textLight,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
