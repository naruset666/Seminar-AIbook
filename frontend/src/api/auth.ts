import { apiRequest } from './client';
import type { User } from '../types';

interface AuthResponse {
  access_token: string;
  user: User;
}

export const authApi = {
  register: (body: { email: string; password: string; display_name: string }) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => apiRequest<{ user: User }>('/auth/me'),
};
