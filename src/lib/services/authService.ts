import { api, bodyOf, ApiError, isApiError } from '../api';
import type { User } from '../types';

export interface LoginResult {
  user: User;
  token?: string;
  accessToken?: string;
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResult> => {
    try {
      const response = await api('/api/v1/auth/login', { method: 'POST', body: credentials });
      const data = bodyOf<Partial<LoginResult>>(response);
      const user = (data.user || data) as User;
      const token = data.accessToken || data.token || '';
      return { user, token };
    } catch (error) {
      if (isApiError(error)) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Login failed', 500, 'LOGIN_ERROR');
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api('/api/v1/auth/profile');
    const data = bodyOf(response);
    return (data.data || data) as User;
  },

  updateProfile: async (profileData: Record<string, unknown>): Promise<User> => {
    const response = await api('/api/v1/auth/profile', { method: 'PUT', body: profileData });
    return bodyOf(response);
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