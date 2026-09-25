import { api, bodyOf, ApiError, isApiError } from '../api';
import { extractEntity } from '../types';
import type { User } from '../types';

export interface LoginResult {
  user: User;
  token?: string;
  accessToken?: string;
}

export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
}

function unwrapAuth(data: any): LoginResult {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data;
  const user = normalizeUser(payload?.user || payload);
  const token = payload?.accessToken || payload?.token || '';
  return { user, token };
}

/** Backend returns `fullName`/`full_name`; the app reads `user.name`. */
function normalizeUser(raw: any): User {
  return {
    ...raw,
    name: raw?.name ?? raw?.fullName ?? raw?.full_name,
  };
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResult> => {
    try {
      const response = await api('/api/v1/auth/login', { method: 'POST', body: credentials });
      return unwrapAuth(bodyOf(response));
    } catch (error) {
      if (isApiError(error)) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Login failed', 500, 'LOGIN_ERROR');
    }
  },

  register: async (input: RegisterInput): Promise<LoginResult> => {
    try {
      const response = await api('/api/v1/auth/register', { method: 'POST', body: input });
      return unwrapAuth(bodyOf(response));
    } catch (error) {
      if (isApiError(error)) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Registration failed', 500, 'REGISTRATION_ERROR');
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api('/api/v1/auth/profile');
    return normalizeUser(extractEntity(bodyOf(response)) || {});
  },

  updateProfile: async (profileData: { name: string }): Promise<User> => {
    const response = await api('/api/v1/auth/profile', { method: 'PUT', body: { fullName: profileData.name } });
    return normalizeUser(extractEntity(bodyOf(response)) || {});
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<any> => {
    const response = await api('/api/v1/auth/change-password', { method: 'POST', body: passwordData });
    return bodyOf(response);
  },

  logout: async (): Promise<void> => {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout API errors — the local token is cleared regardless.
    }
  },
};