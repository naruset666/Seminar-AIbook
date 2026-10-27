import { apiRequest } from './client';
import type { UserSettings } from '../types';

export const settingsApi = {
  get: () => apiRequest<{ settings: UserSettings }>('/settings'),

  update: (changes: Partial<UserSettings>) =>
    apiRequest<{ settings: UserSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(changes),
    }),
};
