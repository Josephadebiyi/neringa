import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';

export default function TrackingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-gray-900 text-3xl font-bold">Track Packages</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-white rounded-2xl p-6 items-center py-12">
          <MapPin size={64} color="#D1D5DB" />
          <Text className="text-gray-400 mt-4 text-lg font-medium">
            No active shipments
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            Track your packages in real-time once they're on their way
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
