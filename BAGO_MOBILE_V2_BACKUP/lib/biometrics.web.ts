// Web stubs for biometric authentication
// These are no-op implementations for web platform

export async function isBiometricSupported(): Promise<boolean> {
  // Web browsers don't support biometric authentication in the same way as mobile
  console.warn('Biometric authentication is not supported on web');
  return false;
}

export async function isBiometricEnrolled(): Promise<boolean> {
  console.warn('Biometric authentication is not supported on web');
  return false;
}

export async function getAvailableBiometricTypes(): Promise<string[]> {
  console.warn('Biometric authentication is not supported on web');
  return [];
}

export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to continue'
): Promise<{ success: boolean; error?: string }> {
  console.warn('Biometric authentication is not supported on web');
  return {
    success: false,
    error: 'Biometric authentication is not supported on web browsers',
  };
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  return false;
}

export async function enableBiometricLogin(): Promise<boolean> {
  console.warn('Biometric authentication is not supported on web');
  return false;
}

export async function disableBiometricLogin(): Promise<void> {
  console.warn('Biometric authentication is not supported on web');
}

export async function getBiometricTypeName(): Promise<string> {
  return 'Biometric';
}

export async function canUseBiometrics(): Promise<{
  available: boolean;
  biometricType: string;
  error?: string;
}> {
  return {
    available: false,
    biometricType: 'None',
    error: 'Biometric authentication is not supported on web browsers',
  };
}
