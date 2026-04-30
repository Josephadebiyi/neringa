import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import config from './config';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: config.googleClientId,
    iosClientId: config.iosGoogleClientId,
    androidClientId: config.androidGoogleClientId,
    webClientId: config.googleClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  return { request, response, promptAsync };
}

export async function processGoogleAuthResponse(response: any) {
  if (!response || response.type !== 'success') {
    const error = response?.type === 'cancel' ? 'User cancelled the authentication' : 'Authentication failed';
    return { success: false, error };
  }

  const { authentication, params } = response;
  return {
    success: true,
    idToken: authentication?.idToken || params?.id_token,
    accessToken: authentication?.accessToken || params?.access_token,
  };
}
