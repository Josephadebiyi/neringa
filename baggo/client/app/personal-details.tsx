import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
   Image,
} from 'react-native';
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { User, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('Sarah');
  const [lastName, setLastName] = useState('Johnson');
  const [profileImage, setProfileImage] = useState(null);
  const [email, setEmail] = useState('sarah.j@email.com');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [address, setAddress] = useState('123 Main Street, New York, NY 10016');
  const [dateOfBirth, setDateOfBirth] = useState('1990-05-15');
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state


  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${backendomain.backendomain}/api/baggo/edit`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.status === 'success') {
          const user = data.data;
          setFirstName(user.firstName || 'Sarah');
          setLastName(user.lastName || 'Johnson');
          setEmail(user.email || 'sarah.j@email.com');
          setPhone(user.phone || '+1 234 567 8900');
          setAddress(user.Address || '123 Main Street, New York, NY 10016');
          setDateOfBirth(user.dateOfBirth || '1990-05-15');
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);





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

    // Upload the image to your backend
    const res = await fetch(`${backendomain.backendomain}/api/baggo/user/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`,
      }),
    });

    const data = await res.json();

    if (data.success) {
      Alert.alert("Success", "Profile image updated!");
      setProfileImage({ uri: data.image });
    } else {
      Alert.alert("Error", data.message || "Upload failed");
    }
  } catch (err) {
    console.error("Image upload error:", err);
    Alert.alert("Error", err.message || "Failed to upload image");
  }
};


  const handleSave = async () => {
    try {
      const updates = {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        Address: address, // Use capitalized 'Address' to match backend
      };
      const response = await fetch(`${backendomain.backendomain}/api/baggo/edit`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (data.status === 'success') {
     Alert.alert('Success', 'Profile updated successfully!');
   } else {
     console.warn('Update API failed:', data.message);
     Alert.alert('Error', data.message || 'Update failed');
   }

      if (data.status !== 'success') {
        console.warn('Update API failed:', data.message);
      }
    } catch (err) {
      console.error('Error during update API call:', err);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

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

          <View style={styles.field}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <MapPin size={20} color={Colors.textLight} style={styles.textAreaIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Full address"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
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
