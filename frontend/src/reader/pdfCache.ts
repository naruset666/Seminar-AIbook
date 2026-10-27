// Loads PDFs with PDF.js and keeps them in memory per document id, so switching tabs
// never re-downloads or re-parses a file. Tabs release their entry when closed.
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { documentsApi } from '../api/documents';
import { tokenStorage } from '../api/client';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PageSize {
  width: number; // CSS pixels at scale 1
  height: number;
}

export interface LoadedPdf {
  pdf: PDFDocumentProxy;
  pageSizes: PageSize[];
}

const cache = new Map<number, Promise<LoadedPdf>>();

async function load(docId: number): Promise<LoadedPdf> {
  const pdf = await pdfjs.getDocument({
    url: documentsApi.fileUrl(docId),
    httpHeaders: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
  }).promise;

  // Page sizes up front let the viewer lay out every page before rendering any of them.
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
  );
  const pageSizes = pages.map((page) => {
    const viewport = page.getViewport({ scale: 1 });
    return { width: viewport.width, height: viewport.height };
  });

  return { pdf, pageSizes };
}

export function getPdf(docId: number): Promise<LoadedPdf> {
  let entry = cache.get(docId);
  if (!entry) {
    entry = load(docId);
    entry.catch(() => cache.delete(docId)); // allow a retry after a failure
    cache.set(docId, entry);
  }
  return entry;
}

export function releasePdf(docId: number): void {
  const entry = cache.get(docId);
  if (!entry) return;
  cache.delete(docId);
  entry.then(({ pdf }) => pdf.destroy()).catch(() => {});
}
