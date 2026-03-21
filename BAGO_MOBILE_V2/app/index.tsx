import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Plane, Shield, Star } from 'lucide-react-native';

const COLORS = {
  primary: '#5845D8',
  primaryLight: '#EEE9FF',
  white: '#FFFFFF',
  gray900: '#111827',
  gray600: '#4B5563',
};

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Bago</Text>
          <Text style={styles.tagline}>
            Your trusted peer-to-peer international package delivery platform
          </Text>
        </View>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <View style={styles.heroCircle}>
            <Package size={120} color={COLORS.primary} />
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon={<Plane size={24} color={COLORS.primary} />}
            title="Send Packages Worldwide"
            description="Connect with travelers going to your destination"
          />
          <FeatureItem
            icon={<Shield size={24} color={COLORS.primary} />}
            title="Secure & Reliable"
            description="Verified travelers and secure payment system"
          />
          <FeatureItem
            icon={<Star size={24} color={COLORS.primary} />}
            title="Save Money"
            description="Get better rates than traditional shipping"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <Pressable
            onPress={() => router.push('/auth/signup')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/auth/signin')}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
  heroContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  heroCircle: {
    width: 256,
    height: 256,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.gray600,
    lineHeight: 20,
  },
  ctaContainer: {
    marginTop: 'auto',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
