import { ApiError, apiRequest, tokenStorage } from './client';
import type { DocumentInfo, PageStrokes } from '../types';

export const documentsApi = {
  list: () => apiRequest<{ documents: DocumentInfo[] }>('/documents'),

  remove: (id: number) => apiRequest<void>(`/documents/${id}`, { method: 'DELETE' }),

  // keepalive lets the last save finish even if the page is being closed.
  updateProgress: (id: number, changes: { last_page?: number; page_count?: number }, keepalive = false) =>
    apiRequest<{ document: DocumentInfo }>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
      keepalive,
    }),

  fileUrl: (id: number) => `/api/documents/${id}/file`,

  getAnnotations: (id: number) => apiRequest<{ strokes: PageStrokes }>(`/documents/${id}/annotations`),

  saveAnnotations: (id: number, strokes: PageStrokes, keepalive = false) =>
    apiRequest<{ updated_at: string }>(`/documents/${id}/annotations`, {
      method: 'PUT',
      body: JSON.stringify({ strokes }),
      keepalive,
    }),

  // Raw bytes of the original file (used to build the annotated export).
  fileBytes: async (id: number): Promise<ArrayBuffer> => {
    const response = await fetch(`/api/documents/${id}/file`, {
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
    });
    if (!response.ok) throw new ApiError('ดาวน์โหลดไฟล์ต้นฉบับไม่สำเร็จ', response.status);
    return response.arrayBuffer();
  },

  // XMLHttpRequest instead of fetch because fetch cannot report upload progress.
  upload: (files: File[], onProgress: (percent: number) => void) =>
    new Promise<DocumentInfo[]>((resolve, reject) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/documents');
      const token = tokenStorage.get();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        let data: { documents?: DocumentInfo[]; message?: string } = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* non-JSON error page */
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.documents) resolve(data.documents);
        else reject(new ApiError(data.message || 'อัปโหลดไม่สำเร็จ', xhr.status));
      };
      xhr.onerror = () => reject(new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 0));
      xhr.send(form);
    }),
};
