import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { documentsApi } from '../api/documents';
import { settingsApi } from '../api/settings';
import { releasePdf } from '../reader/pdfCache';
import type { AnnotationTool, DocumentInfo, StrokeTool } from '../types';

export const MAX_FILE_MB = 50;
const SETTINGS_SAVE_DELAY = 800;
const PAGE_SAVE_DELAY = 1500;

export type Zoom = number | 'fit';
export type Rotation = 0 | 90 | 180 | 270;

export interface TabState {
  docId: number;
  page: number;
  zoom: Zoom;
  rotation: Rotation;
  // Two-page view: the left pane follows `page`, the right pane shows `rightPage`.
  // While `linked`, the right pane stays one page after the left one.
  split: boolean;
  rightPage: number;
  linked: boolean;
}

export type SplitChanges = Partial<Pick<TabState, 'split' | 'rightPage' | 'linked'>>;

// Keys for the per-pane reading position.
export const paneKey = (docId: number, pane: 'left' | 'right') => (pane === 'left' ? `${docId}` : `${docId}:right`);

export const HIGHLIGHT_COLORS = ['#ffd43b', '#8ce99a', '#ffa8c5', '#74c0fc', '#ffc078'];
export const PEN_COLORS = ['#222222', '#e03131', '#1c7ed6', '#2f9e44'];

const newTab = (doc: DocumentInfo): TabState => ({
  docId: doc.id,
  page: doc.last_page,
  zoom: 'fit',
  rotation: 0,
  split: false,
  rightPage: doc.last_page + 1,
  linked: true,
});

export interface UploadState {
  percent: number;
  fileCount: number;
}

interface ReaderContextValue {
  documents: DocumentInfo[];
  loading: boolean;
  error: string;
  tabs: TabState[];
  activeDocId: number | null;
  upload: UploadState | null;
  openDoc: (docId: number) => void;
  closeTab: (docId: number) => void;
  showLibrary: () => void;
  setTabPage: (docId: number, page: number) => void;
  setTabZoom: (docId: number, zoom: Zoom) => void;
  rotateTab: (docId: number) => void;
  setTabSplit: (docId: number, changes: SplitChanges) => void;
  // Drawing tool shared by all tabs.
  tool: AnnotationTool;
  setTool: (tool: AnnotationTool) => void;
  toolColors: Record<StrokeTool, string>;
  setToolColor: (tool: StrokeTool, color: string) => void;
  setPageCount: (docId: number, pageCount: number) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteDoc: (docId: number) => Promise<void>;
  clearError: () => void;
  showError: (message: string) => void;
  // Scroll offsets live outside React state so scrolling never re-renders the tree.
  scrollPositions: Map<string, number>; // keyed by paneKey()
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

// Checks name, MIME type and the "%PDF-" signature (the MIME type alone comes from the file name).
async function validateFile(file: File): Promise<string | null> {
  const isPdfName = file.name.toLowerCase().endsWith('.pdf') && (file.type === 'application/pdf' || file.type === '');
  if (!isPdfName) return `"${file.name}" ไม่ใช่ไฟล์ PDF`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `"${file.name}" ใหญ่เกิน ${MAX_FILE_MB} MB`;
  const signature = await file.slice(0, 5).text().catch(() => '');
  if (signature !== '%PDF-') return `"${file.name}" ไม่ใช่ไฟล์ PDF จริง`;
  return null;
}

interface ReaderProviderProps {
  children: ReactNode;
  openDocId?: number; // open (or switch to) this document once loaded, e.g. from the home page
}

export function ReaderProvider({ children, openDocId }: ReaderProviderProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [tool, setTool] = useState<AnnotationTool>('read');
  const [toolColors, setToolColors] = useState<Record<StrokeTool, string>>({
    highlight: HIGHLIGHT_COLORS[0],
    pen: PEN_COLORS[0],
  });
  const scrollPositions = useRef(new Map<string, number>()).current;

  // Restore the library and the tabs that were open last time.
  useEffect(() => {
    Promise.all([documentsApi.list(), settingsApi.get()])
      .then(([{ documents }, { settings }]) => {
        setDocuments(documents);
        const byId = new Map(documents.map((doc) => [doc.id, doc]));
        const restored = settings.open_tabs
          .filter((id) => byId.has(id))
          .map((id) => newTab(byId.get(id)!));
        let active = settings.active_tab_doc_id;
        if (active === null || !byId.has(active) || !settings.open_tabs.includes(active)) active = null;
        if (openDocId !== undefined && byId.has(openDocId)) {
          if (!restored.some((tab) => tab.docId === openDocId)) restored.push(newTab(byId.get(openDocId)!));
          active = openDocId;
        }
        setTabs(restored);
        setActiveDocId(active);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, []);

  // Persist open tabs + active tab (debounced).
  const tabIdsKey = tabs.map((tab) => tab.docId).join(',');
  useEffect(() => {
    if (!initialized) return;
    const timer = window.setTimeout(() => {
      settingsApi
        .update({
          open_tabs: tabIdsKey ? tabIdsKey.split(',').map(Number) : [],
          active_tab_doc_id: activeDocId,
        })
        .catch((err) => console.error('Saving tabs failed:', err));
    }, SETTINGS_SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [initialized, tabIdsKey, activeDocId]);

  // Persist the last page per document (debounced, flushed on leave).
  const pendingPages = useRef(new Map<number, number>());
  const pageTimer = useRef<number | undefined>(undefined);

  const flushPages = useCallback((keepalive = false) => {
    window.clearTimeout(pageTimer.current);
    for (const [docId, page] of pendingPages.current) {
      documentsApi.updateProgress(docId, { last_page: page }, keepalive).catch(() => {});
    }
    pendingPages.current.clear();
  }, []);

  useEffect(() => {
    const onPageHide = () => flushPages(true);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      flushPages(true);
    };
  }, [flushPages]);

  const setTabPage = useCallback(
    (docId: number, page: number) => {
      setTabs((list) => list.map((tab) => (tab.docId === docId && tab.page !== page ? { ...tab, page } : tab)));
      setDocuments((list) => list.map((doc) => (doc.id === docId ? { ...doc, last_page: page } : doc)));
      pendingPages.current.set(docId, page);
      window.clearTimeout(pageTimer.current);
      pageTimer.current = window.setTimeout(() => flushPages(), PAGE_SAVE_DELAY);
    },
    [flushPages]
  );

  const setTabZoom = useCallback((docId: number, zoom: Zoom) => {
    setTabs((list) => list.map((tab) => (tab.docId === docId ? { ...tab, zoom } : tab)));
  }, []);

  const rotateTab = useCallback((docId: number) => {
    setTabs((list) =>
      list.map((tab) => (tab.docId === docId ? { ...tab, rotation: ((tab.rotation + 90) % 360) as Rotation } : tab))
    );
  }, []);

  const setTabSplit = useCallback((docId: number, changes: SplitChanges) => {
    setTabs((list) => list.map((tab) => (tab.docId === docId ? { ...tab, ...changes } : tab)));
  }, []);

  const setToolColor = useCallback((target: StrokeTool, color: string) => {
    setToolColors((colors) => ({ ...colors, [target]: color }));
    setTool(target);
  }, []);

  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const setPageCount = useCallback((docId: number, pageCount: number) => {
    const doc = documentsRef.current.find((d) => d.id === docId);
    if (!doc || doc.page_count === pageCount) return;
    documentsApi.updateProgress(docId, { page_count: pageCount }).catch(() => {});
    setDocuments((list) => list.map((d) => (d.id === docId ? { ...d, page_count: pageCount } : d)));
  }, []);

  const openDocs = useCallback(
    (docs: DocumentInfo[]) => {
      if (docs.length === 0) return;
      setTabs((list) => {
        const open = new Set(list.map((tab) => tab.docId));
        const added = docs
          .filter((doc) => !open.has(doc.id))
          .map(newTab);
        return added.length ? [...list, ...added] : list;
      });
      setActiveDocId(docs[0].id);
    },
    []
  );

  // Opening a document that is already open just switches to its tab.
  const openDoc = useCallback(
    (docId: number) => {
      const doc = documents.find((d) => d.id === docId);
      if (doc) openDocs([doc]);
    },
    [documents, openDocs]
  );

  const closeTab = useCallback(
    (docId: number) => {
      const index = tabs.findIndex((tab) => tab.docId === docId);
      if (index === -1) return;
      const next = tabs.filter((tab) => tab.docId !== docId);
      setTabs(next);
      if (activeDocId === docId) {
        // Move to the tab that slid into this position, else the one before it.
        const neighbour = next[index] ?? next[index - 1];
        setActiveDocId(neighbour ? neighbour.docId : null);
      }
      scrollPositions.delete(paneKey(docId, 'left'));
      scrollPositions.delete(paneKey(docId, 'right'));
      releasePdf(docId);
    },
    [tabs, activeDocId, scrollPositions]
  );

  const showLibrary = useCallback(() => setActiveDocId(null), []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const results = await Promise.all(files.map(validateFile));
      const problems = results.filter((msg): msg is string => msg !== null);
      const valid = files.filter((_, i) => results[i] === null);
      setError(problems.join(' · '));
      if (valid.length === 0) return;

      setUpload({ percent: 0, fileCount: valid.length });
      try {
        const uploaded = await documentsApi.upload(valid, (percent) =>
          setUpload({ percent, fileCount: valid.length })
        );
        setDocuments((list) => [...uploaded, ...list]);
        openDocs(uploaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ');
      } finally {
        setUpload(null);
      }
    },
    [openDocs]
  );

  const deleteDoc = useCallback(
    async (docId: number) => {
      try {
        await documentsApi.remove(docId);
        closeTab(docId);
        pendingPages.current.delete(docId);
        setDocuments((list) => list.filter((doc) => doc.id !== docId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
      }
    },
    [closeTab]
  );

  const clearError = useCallback(() => setError(''), []);
  const showError = useCallback((message: string) => setError(message), []);

  const value = useMemo(
    () => ({
      documents,
      loading,
      error,
      tabs,
      activeDocId,
      upload,
      openDoc,
      closeTab,
      showLibrary,
      setTabPage,
      setTabZoom,
      rotateTab,
      setTabSplit,
      tool,
      setTool,
      toolColors,
      setToolColor,
      setPageCount,
      uploadFiles,
      deleteDoc,
      clearError,
      showError,
      scrollPositions,
    }),
    [
      documents, loading, error, tabs, activeDocId, upload, openDoc, closeTab, showLibrary,
      setTabPage, setTabZoom, rotateTab, setTabSplit, tool, toolColors, setToolColor, setPageCount, uploadFiles, deleteDoc, clearError, showError, scrollPositions,
    ]
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader(): ReaderContextValue {
  const context = useContext(ReaderContext);
  if (!context) throw new Error('useReader must be used inside ReaderProvider');
  return context;
}
