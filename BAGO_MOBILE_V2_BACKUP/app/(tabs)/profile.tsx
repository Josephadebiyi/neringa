import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Settings, Bell, HelpCircle, FileText, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-gray-900 text-3xl font-bold">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 items-center">
          <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
            <User size={48} color="#5845D8" />
          </View>
          <Text className="text-gray-900 text-xl font-bold">John Doe</Text>
          <Text className="text-gray-500 mt-1">john.doe@example.com</Text>
        </View>

        {/* Menu Items */}
        <View className="bg-white rounded-2xl overflow-hidden mb-6">
          <MenuItem
            icon={<Settings size={24} color="#6B7280" />}
            label="Account Settings"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Bell size={24} color="#6B7280" />}
            label="Notifications"
            onPress={() => {}}
            showDivider
          />
          <MenuItem
            icon={<HelpCircle size={24} color="#6B7280" />}
            label="Help & Support"
            onPress={() => {}}
            showDivider
          />
          <MenuItem
            icon={<FileText size={24} color="#6B7280" />}
            label="Terms & Privacy"
            onPress={() => {}}
            showDivider
          />
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="bg-white rounded-2xl p-4 flex-row items-center justify-center mb-8"
        >
          <LogOut size={24} color="#EF4444" />
          <Text className="text-red-500 font-semibold text-lg ml-2">
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  showDivider = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-4 py-4 active:bg-gray-50"
      >
        {icon}
        <Text className="flex-1 text-gray-900 font-medium text-base ml-4">
          {label}
        </Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </Pressable>
      {showDivider && <View className="h-px bg-gray-100 mx-4" />}
    </>
  );
}
