import { apiRequest } from './client';
import type { Preset } from '../types';

export const presetsApi = {
  list: () => apiRequest<{ presets: Preset[] }>('/presets'),
};
