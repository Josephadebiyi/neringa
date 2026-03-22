import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Platform-specific secure storage utility
// Uses SecureStore on native, localStorage on web
class SecureStorage {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error getting item from localStorage:', error);
        return null;
      }
    } else {
      // Use SecureStore on native
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('Error getting item from SecureStore:', error);
        return null;
      }
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting item in localStorage:', error);
      }
    } else {
      // Use SecureStore on native
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Error setting item in SecureStore:', error);
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from localStorage:', error);
      }
    } else {
      // Use SecureStore on native
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Error removing item from SecureStore:', error);
      }
    }
  }
}

export const secureStorage = new SecureStorage();
