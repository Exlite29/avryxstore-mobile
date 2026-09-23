import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_KEY = 'avryx:api_url';

export const DEFAULT_API_URL = 'https://avryxstore-be.onrender.com';

export async function getApiUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(API_URL_KEY);
    return (stored || DEFAULT_API_URL).replace(/\/+$/, '');
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(API_URL_KEY, clean);
  return clean as unknown as Promise<void>;
}