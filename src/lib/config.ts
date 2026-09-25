export const DEFAULT_API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');

export async function getApiUrl(): Promise<string> {
  return DEFAULT_API_URL;
}