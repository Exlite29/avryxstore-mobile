import axios, { isAxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from './config';

const TOKEN_KEY = 'avryx:token';

export class ApiError extends Error {
  statusCode: number;
  errorCode: string | null;
  details: unknown;

  constructor(message: string, statusCode = 500, errorCode: string | null = null, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions extends Omit<AxiosRequestConfig, 'data'> {
  body?: unknown;
}

export async function api(path: string, options: RequestOptions = {}): Promise<any> {
  const baseURL = await getApiUrl();
  const token = await getToken();

  try {
    const response = await axios.request({
      url: path,
      baseURL,
      method: options.method || 'GET',
      params: options.params,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      data: options.method === 'GET' ? undefined : options.body,
    });
    return response;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const message =
        (typeof data === 'string' && data) ||
        (data && (data.message || data.error)) ||
        `Request failed with status ${status}`;
      const errorCode = data?.code || data?.errorCode || null;
      const details = data?.details || data?.errors || null;
      throw new ApiError(message, status, errorCode, details);
    }
    if (isAxiosError(error) && error.request) {
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timed out. Please try again.', 0, 'TIMEOUT_ERROR');
      }
      throw new ApiError('Cannot reach the server. Check your connection and API URL.', 0, 'NETWORK_ERROR');
    }
    throw new ApiError(error instanceof Error ? error.message : 'Request failed', 500, 'UNKNOWN_ERROR');
  }
}

/** Unwrap the axios response to the response body (same shape the web app consumes). */
export function bodyOf<T = any>(response: any): T {
  return response?.data as T;
}
