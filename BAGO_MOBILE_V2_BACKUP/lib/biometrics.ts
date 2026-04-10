import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  return hasHardware;
}

/**
 * Check if biometrics are enrolled (fingerprint or face registered)
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

/**
 * Get available biometric types (Face ID, Fingerprint, etc.)
 */
export async function getAvailableBiometricTypes(): Promise<string[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const biometricTypes: string[] = [];

  types.forEach(type => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        biometricTypes.push(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
        break;
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        biometricTypes.push(Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition');
        break;
      case LocalAuthentication.AuthenticationType.IRIS:
        biometricTypes.push('Iris Recognition');
        break;
    }
  });

  return biometricTypes;
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to continue'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if device supports biometrics
    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      return {
        success: false,
        error: 'Biometric authentication is not supported on this device',
      };
    }

    // Check if biometrics are enrolled
    const isEnrolled = await isBiometricEnrolled();
    if (!isEnrolled) {
      return {
        success: false,
        error: 'No biometric credentials registered on this device',
      };
    }

    // Authenticate
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false, // Allow PIN/Password fallback
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    };
  }
}

/**
 * Check if user has enabled biometric login
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable biometric login
 */
export async function enableBiometricLogin(): Promise<boolean> {
  try {
    // First verify that biometrics work
    const authResult = await authenticateWithBiometrics(
      'Authenticate to enable biometric login'
    );

    if (authResult.success) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Disable biometric login
 */
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error('Error disabling biometric login:', error);
  }
}

/**
 * Get biometric type display name
 */
export async function getBiometricTypeName(): Promise<string> {
  const types = await getAvailableBiometricTypes();
  if (types.length === 0) {
    return 'Biometric';
  }
  return types[0]; // Return the first available type
}

/**
 * Check if biometric authentication is fully ready to use
 */
export async function canUseBiometrics(): Promise<{
  available: boolean;
  biometricType: string;
  error?: string;
}> {
  const isSupported = await isBiometricSupported();

  if (!isSupported) {
    return {
      available: false,
      biometricType: 'None',
      error: 'Device does not support biometric authentication',
    };
  }

  const isEnrolled = await isBiometricEnrolled();

  if (!isEnrolled) {
    return {
      available: false,
      biometricType: await getBiometricTypeName(),
      error: 'No biometric credentials enrolled',
    };
  }

  return {
    available: true,
    biometricType: await getBiometricTypeName(),
  };
}
