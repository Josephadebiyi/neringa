import { View, Text, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Plane, Shield, Star } from 'lucide-react-native';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        {/* Logo/Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-primary mb-2">Bago</Text>
          <Text className="text-gray-600 text-center text-base">
            Your trusted peer-to-peer international package delivery platform
          </Text>
        </View>

        {/* Hero Image */}
        <View className="items-center my-8">
          <View className="w-64 h-64 bg-primary-100 rounded-full items-center justify-center">
            <Package size={120} color="#5845D8" />
          </View>
        </View>

        {/* Features */}
        <View className="space-y-4 mb-8">
          <FeatureItem
            icon={<Plane size={24} color="#5845D8" />}
            title="Send Packages Worldwide"
            description="Connect with travelers going to your destination"
          />
          <FeatureItem
            icon={<Shield size={24} color="#5845D8" />}
            title="Secure & Reliable"
            description="Verified travelers and secure payment system"
          />
          <FeatureItem
            icon={<Star size={24} color="#5845D8" />}
            title="Save Money"
            description="Get better rates than traditional shipping"
          />
        </View>

        {/* CTA Buttons */}
        <View className="mt-auto mb-8 space-y-3">
          <Pressable
            onPress={() => router.push('/auth/signup')}
            className="bg-primary py-4 rounded-xl active:opacity-80"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Get Started
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/auth/signin')}
            className="border-2 border-primary py-4 rounded-xl active:opacity-60"
          >
            <Text className="text-primary text-center font-semibold text-lg">
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start space-x-3">
      <View className="mt-1">{icon}</View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base mb-1">
          {title}
        </Text>
        <Text className="text-gray-600 text-sm">
          {description}
        </Text>
      </View>
    </View>
  );
}
