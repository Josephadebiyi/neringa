import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs — read from EXPO_PUBLIC_* env vars
const GOOGLE_CLIENT_IDS = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
};

export interface GoogleAuthResponse {
  success: boolean;
  idToken?: string;
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  error?: string;
}

/**
 * Hook to handle Google Sign-In with Expo
 * Returns request, response, and promptAsync function
 */
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    webClientId: GOOGLE_CLIENT_IDS.web,
    scopes: ['profile', 'email'],
  });

  return { request, response, promptAsync };
};

/**
 * Extract user information from Google ID token
 */
export const parseGoogleIdToken = (idToken: string) => {
  try {
    // Decode the JWT token (simple base64 decode for the payload)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Use a safe base64 decode (works on both web and native)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Internal polyfill for atob to avoid global dependency issues
    const decodeBase64 = (str: string) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      str = String(str).replace(/=+$/, '');
      let bc = 0, bs = 0, buffer, idx = 0;
      while ((buffer = str.charAt(idx++))) {
        buffer = chars.indexOf(buffer);
        if (~buffer) {
          bs = bc % 4 ? (bs * 64 + buffer) : buffer;
          if (bc++ % 4) {
             output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
          }
        }
      }
      return output;
    };

    const jsonPayload = decodeURIComponent(
      decodeBase64(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    console.error('Error parsing Google ID token:', error);
    return null;
  }
};

/**
 * Process Google authentication response
 */
export const processGoogleAuthResponse = async (
  response: any
): Promise<GoogleAuthResponse> => {
  try {
    if (response?.type === 'success') {
      const { authentication } = response;

      if (!authentication) {
        return {
          success: false,
          error: 'No authentication data received',
        };
      }

      const { idToken, accessToken } = authentication;

      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();

      return {
        success: true,
        idToken,
        accessToken,
        user: {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      };
    } else if (response?.type === 'cancel') {
      return {
        success: false,
        error: 'User cancelled the authentication',
      };
    } else {
      return {
        success: false,
        error: response?.error?.message || 'Authentication failed',
      };
    }
  } catch (error: any) {
    console.error('Google auth error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Sign out from Google (revoke access token)
 */
export const googleSignOut = async (accessToken: string) => {
  try {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error('Google sign out error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out',
    };
  }
};
