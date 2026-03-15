import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const googleClientId = Constants.expoConfig?.extra?.googleClientId || '';
  const iosGoogleClientId = Constants.expoConfig?.extra?.iosGoogleClientId || googleClientId;
  const androidGoogleClientId = Constants.expoConfig?.extra?.androidGoogleClientId || googleClientId;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId,
    iosClientId: iosGoogleClientId,
    androidClientId: androidGoogleClientId,
    webClientId: googleClientId,
  });

  return {
    request,
    response,
    promptAsync,
  };
};

export const processGoogleAuthResult = async (
  result: any,
  onSuccess: (token: string, userInfo: any) => void,
  onError: (error: string) => void
) => {
  try {
    if (result?.type === 'success') {
      const { authentication } = result;

      if (authentication?.accessToken) {
        // Fetch user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          }
        );

        const userInfo = await userInfoResponse.json();
        onSuccess(authentication.accessToken, userInfo);
      } else {
        onError('Failed to get access token');
      }
    } else if (result?.type === 'error') {
      onError(result.error?.message || 'Google sign-in failed');
    } else if (result?.type === 'cancel') {
      onError('Google sign-in was cancelled');
    }
  } catch (error: any) {
    onError(error.message || 'An error occurred during Google sign-in');
  }
};
