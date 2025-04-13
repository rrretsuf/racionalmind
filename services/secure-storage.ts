import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStorage: Error getting token:', key, error);
      return null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStorage: Error saving token:', key, error);
    }
  },

  async removeToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStorage: Error removing token:', key, error);
    }
  },
}; 