import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Info, MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function EditBioScreen() {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState((user as any)?.bio || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await updateUser({ bio } as any);
      if (Platform.OS === 'web') {
         window.alert('Bio updated successfully');
      } else {
         Alert.alert('Success', 'Bio updated successfully');
      }
      handleBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update bio');
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
        <Text style={styles.headerTitle}>Add a mini bio</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>WHAT WOULD YOU LIKE MEMBERS TO KNOW ABOUT YOU?</Text>
        <View style={styles.textAreaRow}>
          <MessageSquare size={20} color={COLORS.primary} style={{ marginTop: 16 }} />
          <TextInput 
            style={styles.textArea}
            value={bio}
            onChangeText={setBio}
            placeholder="Write a short bio about yourself..."
            multiline={true}
            numberOfLines={10}
            maxLength={250}
            autoFocus={true}
          />
        </View>
        <Text style={styles.counter}>{bio.length}/250 characters</Text>

        <View style={styles.tipBox}>
          <Info size={20} color={COLORS.primary} />
          <View style={styles.tipTextRow}>
            <Text style={styles.tipTitle}>Why a bio?</Text>
            <Text style={styles.tipText}>
              Members with a bio are 3x more likely to have their shipments or trips booked. A complete profile builds trust in the Bago community.
            </Text>
          </View>
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
  label: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 16, marginTop: 20 },
  textAreaRow: { 
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.bgSoft, 
    borderRadius: 24, paddingHorizontal: 20, minHeight: 200, gap: 16 
  },
  textArea: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.black, textAlignVertical: 'top', paddingTop: 16, paddingBottom: 16 },
  counter: { textAlign: 'right', marginTop: 12, fontSize: 13, color: COLORS.gray400, fontWeight: '600' },
  tipBox: { marginTop: 40, flexDirection: 'row', gap: 16, backgroundColor: COLORS.primarySoft, padding: 20, borderRadius: 20 },
  tipTextRow: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  tipText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', lineHeight: 20 },
});

import { ActivityIndicator } from 'react-native';
