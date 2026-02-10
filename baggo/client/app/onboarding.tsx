import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Send Packages Worldwide',
    description: 'Connect with trusted travelers heading to your destination. Send packages safely and affordably.',
    emoji: '📦',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    id: '2',
    title: 'Earn While Traveling',
    description: 'Turn your unused luggage space into extra income. Get paid to deliver packages on your trips.',
    emoji: '✈️',
    gradient: ['#8B5CF6', '#A855F7'],
  },
  {
    id: '3',
    title: 'Secure & Verified',
    description: 'All users are KYC verified. Your packages are insured and tracked in real-time.',
    emoji: '🛡️',
    gradient: ['#A855F7', '#6366F1'],
  },
  {
    id: '4',
    title: 'Easy Payments',
    description: 'Secure escrow payments protect both senders and travelers. Get paid instantly upon delivery.',
    emoji: '💰',
    gradient: ['#6366F1', '#4F46E5'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/auth/signin');
    } catch (error) {
      router.replace('/auth/signin');
    }
  };

  const currentSlide = onboardingData[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/bago-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Current Slide Content */}
      <View style={styles.slideContainer}>
        <LinearGradient
          colors={currentSlide.gradient as [string, string]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.emoji}>{currentSlide.emoji}</Text>
        </LinearGradient>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { 
                width: index === currentIndex ? 24 : 8,
                opacity: index === currentIndex ? 1 : 0.3,
              }
            ]}
          />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentIndex === onboardingData.length - 1 && (
          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => router.push('/auth/signin')}
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 120,
    height: 50,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginHorizontal: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  signInText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  signInTextBold: {
    color: '#6366F1',
    fontWeight: '600',
  },
});
