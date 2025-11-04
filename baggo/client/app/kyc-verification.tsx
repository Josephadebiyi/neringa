import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Shield, FileText, Camera, CircleCheck as CheckCircle, Upload, CircleAlert as AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API
import { backendomain } from '@/utils/backendDomain';

const API_BASE_URL = `${backendomain.backendomain}/api/baggo`;

export default function KYCVerificationScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null); // Store finduser data
  const [kycData, setKycData] = useState(null); // Store kyc data
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [identityDocument, setIdentityDocument] = useState(null);
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [verificationSelfie, setVerificationSelfie] = useState(null);

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/getKyc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send auth cookie
      });
      const data = await response.json();

      if (data.status === 'success') {
        setUserData(data.data.finduser); // Store user data
        setKycData(data.data.kyc); // Store kyc data
      } else {
        // Alert.alert('Error', data.message || 'Failed to fetch KYC status');
      }
    } catch (error) {
      console.error('Fetch KYC error:', error);
      // Alert.alert('Error', 'Failed to fetch KYC status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // const handleFileSelect = async (step) => {
  //   // Prevent uploads if KYC is already submitted
  //   if (kycData) {
  //     Alert.alert('Info', 'KYC already submitted and under review');
  //     return;
  //   }
  //
  //   try {
  //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //     if (status !== 'granted') {
  //       Alert.alert('Permission denied', 'Please allow access to photos');
  //       return;
  //     }
  //
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       quality: 0.8,
  //     });
  //
  //     if (!result.canceled && result.assets[0].uri) {
  //       const { uri, mimeType } = result.assets[0];
  //
  //       // Validate MIME type (JPEG or PNG only)
  //       const validMimeTypes = ['image/jpeg', 'image/png'];
  //       if (!validMimeTypes.includes(mimeType)) {
  //         Alert.alert('Error', 'Only JPEG or PNG images are allowed');
  //         return;
  //       }
  //
  //       // Check file size (<10MB) using legacy FileSystem.getInfoAsync
  //       const fileInfo = await FileSystem.getInfoAsync(uri);
  //       if (!fileInfo.exists) {
  //         Alert.alert('Error', 'File does not exist');
  //         return;
  //       }
  //       const fileSizeMB = fileInfo.size / (1024 * 1024); // Convert bytes to MB
  //       if (fileSizeMB > 10) {
  //         Alert.alert('Error', 'Image size must be under 10MB');
  //         return;
  //       }
  //
  //       // Read file as base64
  //       const base64 = await FileSystem.readAsStringAsync(uri, {
  //         encoding: FileSystem.EncodingType.Base64,
  //       });
  //       const base64String = `data:${mimeType};base64,${base64}`;
  //       console.log(`Base64 for step ${step} (first 50 chars):`, base64String.substring(0, 50));
  //
  //       // Validate base64 format
  //       const base64Regex = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;
  //       if (!base64Regex.test(base64String)) {
  //         Alert.alert('Error', 'Invalid base64 format generated');
  //         return;
  //       }
  //
  //       if (step === 1) {
  //         setIdentityDocument(base64String);
  //       } else if (step === 2) {
  //         setProofOfAddress(base64String);
  //       } else if (step === 3) {
  //         setVerificationSelfie(base64String);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('ImagePicker error:', error);
  //     Alert.alert('Error', 'Failed to select file');
  //   }
  // };



  const handleFileSelect = async (step) => {
    if (kycData) {
      Alert.alert('Info', 'KYC already submitted and under review');
      return;
    }

    try {
      // Ask user if they want to use camera or gallery
      Alert.alert(
        'Select Option',
        'Choose how you want to upload your image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.status !== 'granted') {
                Alert.alert('Permission denied', 'Please allow camera access');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0].uri) {
                await processImage(result.assets[0], step);
              }
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (mediaPermission.status !== 'granted') {
                Alert.alert('Permission denied', 'Please allow access to photos');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0].uri) {
                await processImage(result.assets[0], step);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };


  const processImage = async (asset, step) => {
    const { uri, mimeType } = asset;

    const validMimeTypes = ['image/jpeg', 'image/png'];
    if (!validMimeTypes.includes(mimeType)) {
      Alert.alert('Error', 'Only JPEG or PNG images are allowed');
      return;
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      Alert.alert('Error', 'File does not exist');
      return;
    }
    const fileSizeMB = fileInfo.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      Alert.alert('Error', 'Image size must be under 10MB');
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const base64String = `data:${mimeType};base64,${base64}`;

    if (step === 1) setIdentityDocument(base64String);
    else if (step === 2) setProofOfAddress(base64String);
    else if (step === 3) setVerificationSelfie(base64String);
  };



  const handleSubmit = async () => {
    // Prevent submission if KYC is already submitted
    if (kycData) {
      Alert.alert('Info', 'KYC already submitted and under review');
      return;
    }

    if (!identityDocument || !proofOfAddress || !verificationSelfie) {
      Alert.alert('Error', 'Please upload all documents');
      return;
    }

    try {
      setUploading(true);

      const formData = {
        identityDocument,
        proofOfAddress,
        verificationSelfie,
      };

      console.log('Submitting KYC data:', {
        identityDocument: identityDocument.substring(0, 50) + '...',
        proofOfAddress: proofOfAddress.substring(0, 50) + '...',
        verificationSelfie: verificationSelfie.substring(0, 50) + '...',
      });

      const response = await fetch(`${API_BASE_URL}/KycVerifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'KYC submitted successfully');
        setIdentityDocument(null);
        setProofOfAddress(null);
        setVerificationSelfie(null);
        fetchKycStatus();
      } else {
        Alert.alert('Error', data.message || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('Submit KYC error:', error);
      Alert.alert('Error', 'Failed to submit KYC');
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Identity Document',
      description: 'Upload a government-issued ID (Passport, ID card, or driving license)',
      icon: FileText,
      status: kycData?.identityDocument ? 'completed' : identityDocument ? 'uploaded' : 'pending',
    },
    {
      id: 2,
      title: 'Proof of Address',
      description: 'Upload a recent utility bill or bank statement (not older than 3 months)',
      icon: FileText,
      status: kycData?.proofOfAddress ? 'completed' : proofOfAddress ? 'uploaded' : 'pending',
    },
    {
      id: 3,
      title: 'Selfie Verification',
      description: 'Take a selfie holding your ID document',
      icon: Camera,
      status: kycData?.verificationSelfie ? 'completed' : verificationSelfie ? 'uploaded' : 'pending',
    },
  ];

  const isSubmitEnabled = identityDocument && proofOfAddress && verificationSelfie && !kycData;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statusCard}>
              <Shield size={48} color={Colors.success} />
              <Text style={styles.statusTitle}>
                {kycData ? 'Verification Status' : 'Start Verification'}
              </Text>
              {userData && (
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoText}>
                    Name: {userData.firstName} {userData.lastName}
                  </Text>
                  <Text style={styles.userInfoText}>Email: {userData.email}</Text>
                  <Text style={styles.userInfoText}>
                    Status: {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}
                  </Text>
                </View>
              )}
              <Text style={styles.statusSubtitle}>
                {kycData
                  ? `KYC submitted on ${new Date(kycData.createdAt || Date.now()).toLocaleDateString()}. Awaiting review.`
                  : 'Complete all steps to start carrying packages'}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <AlertCircle size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>EU GDPR Compliant</Text>
                <Text style={styles.infoText}>
                  Your data is processed in accordance with EU General Data Protection Regulation (GDPR).
                  We use bank-level encryption to protect your personal information.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Steps</Text>

              {steps.map((step, index) => (
                <View key={step.id} style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    {step.status === 'completed' ? (
                      <CheckCircle size={24} color={Colors.success} fill={Colors.success} />
                    ) : step.status === 'uploaded' ? (
                      <CheckCircle size={24} color={Colors.primary} />
                    ) : (
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <step.icon size={20} color={Colors.primary} />
                      <Text style={styles.stepTitle}>{step.title}</Text>
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>

                    {step.status === 'completed' ? (
                      <View style={styles.completedBadge}>
                        <CheckCircle size={14} color={Colors.success} />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.uploadButton, (uploading || kycData) && styles.disabledButton]}
                        onPress={() => handleFileSelect(step.id)}
                        disabled={uploading || kycData}
                      >
                        <Upload size={16} color={Colors.primary} />
                        <Text style={styles.uploadButtonText}>
                          {step.status === 'uploaded' ? 'Uploaded (Replace)' : 'Upload Document'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isSubmitEnabled && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!isSubmitEnabled || uploading}
              >
                <Text style={styles.submitButtonText}>
                  {uploading ? 'Submitting...' : 'Submit KYC'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>

              <View style={styles.requirementCard}>
                <Text style={styles.requirementTitle}>Document Requirements:</Text>
                <Text style={styles.requirementText}>• Must be in color</Text>
                <Text style={styles.requirementText}>• All corners visible</Text>
                <Text style={styles.requirementText}>• Text clearly readable</Text>
                <Text style={styles.requirementText}>• Not expired</Text>
                <Text style={styles.requirementText}>• File size under 10MB</Text>
                <Text style={styles.requirementText}>• Format: JPG, PNG</Text>
              </View>

              <View style={styles.requirementCard}>
                <Text style={styles.requirementTitle}>Processing Time:</Text>
                <Text style={styles.requirementText}>
                  Verification typically takes 24-48 hours. You'll receive a notification once your
                  documents have been reviewed.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Protection</Text>

              <View style={styles.dataCard}>
                <Text style={styles.dataText}>
                  • Your documents are encrypted and stored securely
                </Text>
                <Text style={styles.dataText}>
                  • We comply with EU GDPR and data protection laws
                </Text>
                <Text style={styles.dataText}>
                  • Your data is never shared with third parties
                </Text>
                <Text style={styles.dataText}>
                  • You can request data deletion at any time
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </>
        )}
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
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  requirementCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requirementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 4,
  },
  dataCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  dataText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 8,
  },
});
