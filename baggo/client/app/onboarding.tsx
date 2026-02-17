import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Send packages',
    titleBold: 'worldwide',
    description: 'Connect with trusted travelers heading to your destination safely.',
    image: require('@/assets/images/onboarding-1.jpg'),
  },
  {
    id: '2',
    title: 'Earn while',
    titleBold: 'traveling',
    description: 'Turn your unused luggage space into extra income on every trip.',
    image: require('@/assets/images/onboarding-2.jpg'),
  },
  {
    id: '3',
    title: 'Secure and',
    titleBold: 'verified',
    description: 'All users are KYC verified. Packages insured and tracked.',
    image: require('@/assets/images/onboarding-3.jpg'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colors } = useTheme();

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20, backgroundColor: '#F8F6F3' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/bago-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={[styles.skipButton, { backgroundColor: '#FFFFFF' }]} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: '#6B6B6B' }]}>skip</Text>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: '#1A1A1A' }]}>
          {currentSlide.title}{'\n'}
          <Text style={[styles.titleBold, { color: '#5845D8' }]}>{currentSlide.titleBold}</Text>
        </Text>
        <Text style={[styles.description, { color: '#9E9E9E' }]}>{currentSlide.description}</Text>
      </View>

      {/* Image Card */}
      <View style={styles.imageContainer}>
        <View style={[styles.imageCard, { borderColor: '#5845D8' }]}>
          <Image
            source={currentSlide.image}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {currentIndex > 0 ? (
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#FFFFFF' }]} onPress={handleBack}>
            <ChevronLeft size={24} color={'#1A1A1A'} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <TouchableOpacity style={[styles.nextButton, { backgroundColor: '#4CAF50' }]} onPress={handleNext}>
          <Text style={[styles.nextButtonText, { color: '#FFFFFF' }]}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: '#E5E5E5' },
              index === currentIndex && [styles.dotActive, { backgroundColor: '#5845D8' }],
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 40,
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    color: '#1A1A2E',
    fontWeight: '400',
    lineHeight: 42,
  },
  titleBold: {
    fontWeight: '700',
    color: '#6366F1',
  },
  description: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
    lineHeight: 20,
  },
  imageContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 50,
    height: 50,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#6366F1',
  },
});
