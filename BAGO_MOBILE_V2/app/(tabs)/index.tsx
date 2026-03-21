import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Plane, TrendingUp, MapPin } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 pt-4 pb-8 rounded-b-3xl">
          <Text className="text-white text-3xl font-bold mb-2">
            Welcome to Bago
          </Text>
          <Text className="text-primary-100 text-base">
            What would you like to do today?
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-4 mb-6">
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row justify-between">
              <QuickAction
                icon={<Package size={28} color="#5845D8" />}
                label="Send Package"
              />
              <QuickAction
                icon={<Plane size={28} color="#5845D8" />}
                label="Add Trip"
              />
              <QuickAction
                icon={<MapPin size={28} color="#5845D8" />}
                label="Track"
              />
              <QuickAction
                icon={<TrendingUp size={28} color="#5845D8" />}
                label="Rates"
              />
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 mb-6">
          <Text className="text-gray-900 text-xl font-bold mb-4">
            Your Activity
          </Text>
          <View className="flex-row justify-between">
            <StatCard title="Active" value="0" color="bg-blue-500" />
            <StatCard title="Delivered" value="0" color="bg-green-500" />
            <StatCard title="In Transit" value="0" color="bg-yellow-500" />
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-6">
          <Text className="text-gray-900 text-xl font-bold mb-4">
            Recent Activity
          </Text>
          <View className="bg-white rounded-2xl p-6">
            <View className="items-center py-8">
              <Package size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4">
                No recent activity yet
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                Start by sending a package or adding a trip
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable className="items-center flex-1 active:opacity-60">
      <View className="bg-primary-50 w-16 h-16 rounded-xl items-center justify-center mb-2">
        {icon}
      </View>
      <Text className="text-gray-700 text-xs font-medium text-center">
        {label}
      </Text>
    </Pressable>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View className="bg-white rounded-xl p-4 flex-1 mx-1 shadow-sm">
      <View className={`w-10 h-10 rounded-lg ${color} items-center justify-center mb-2`}>
        <Text className="text-white font-bold text-lg">{value}</Text>
      </View>
      <Text className="text-gray-600 text-sm">{title}</Text>
    </View>
  );
}
