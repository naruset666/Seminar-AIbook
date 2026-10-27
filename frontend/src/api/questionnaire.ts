import { apiRequest } from './client';
import type { Answers, Question, QuestionnaireResponse, QuestionnaireSubmitResult } from '../types';

export const questionnaireApi = {
  questions: () => apiRequest<{ questions: Question[] }>('/questionnaire'),

  submit: (answers: Answers) =>
    apiRequest<QuestionnaireSubmitResult>('/questionnaire', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  latest: () => apiRequest<{ latest: QuestionnaireResponse | null }>('/questionnaire/latest'),

  // Every questionnaire attempt is kept as a saved preference ("mood").
  history: () => apiRequest<{ preferences: QuestionnaireResponse[] }>('/questionnaire/history'),

  // Rename a preference and/or pick a place from it (also sets the active preset).
  update: (id: number, changes: { label?: string | null; chosen_preset_id?: string }) =>
    apiRequest<{ preference: QuestionnaireResponse }>(`/questionnaire/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  remove: (id: number) => apiRequest<void>(`/questionnaire/${id}`, { method: 'DELETE' }),
};
