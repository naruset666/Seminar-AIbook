import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { exportAnnotatedPdf } from '../../reader/exportPdf';
import { getPdf, type LoadedPdf } from '../../reader/pdfCache';
import { useAnnotations } from '../../reader/useAnnotations';
import { paneKey, useReader, type TabState } from '../../store/ReaderContext';
import AnnotationTools from './AnnotationTools';
import FloatingToolbarDock from './FloatingToolbarDock';
import PaneHeader from './PaneHeader';
import PdfPane, { MAX_SCALE, MIN_SCALE, type PdfPaneHandle } from './PdfPane';
import ViewerToolbar from './ViewerToolbar';
import './PdfViewer.css';

const ZOOM_STEP = 1.2;

type Pane = 'left' | 'right';

interface PdfViewerProps {
  tab: TabState;
}

// Viewer for one tab. Two-page view has two modes:
// - linked ("ต่อกัน"): one pane with pages in pairs (1|2, 3|4, …) that scroll together;
// - independent ("อิสระ"): two panes, each scrolled and paged on its own.
// The toolbar (page buttons, zoom, keyboard) acts on the active pane; strokes are
// shared, so drawing in either pane edits the same document.
export default function PdfViewer({ tab }: PdfViewerProps) {
  const {
    documents, setTabPage, setTabZoom, rotateTab, setTabSplit, setPageCount, scrollPositions, showError,
  } = useReader();
  const { docId, rotation, split, linked } = tab;
  const annotations = useAnnotations(docId);
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePane, setActivePane] = useState<Pane>('left');
  const [scales, setScales] = useState<Record<Pane, number>>({ left: 1, right: 1 });
  const rootRef = useRef<HTMLDivElement>(null);
  const paneRefs = { left: useRef<PdfPaneHandle>(null), right: useRef<PdfPaneHandle>(null) };

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError('');
    getPdf(docId)
      .then((result) => {
        if (cancelled) return;
        setLoaded(result);
        setPageCount(docId, result.pdf.numPages);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('เปิดไฟล์ PDF ไม่สำเร็จ');
      });
    return () => {
      cancelled = true;
    };
  }, [docId, setPageCount]);

  const pageCount = loaded?.pageSizes.length ?? 0;
  const clampPage = useCallback((page: number) => Math.min(Math.max(page, 1), Math.max(pageCount, 1)), [pageCount]);
  const spread = split && linked; // pages in pairs, one scroll
  const independent = split && !linked; // two panes
  const currentPane: Pane = independent ? activePane : 'left';
  const panePage = (pane: Pane) => (pane === 'left' ? Math.min(tab.page, pageCount) : clampPage(tab.rightPage));
  const pageStep = spread ? 2 : 1;

  const onLeftPage = useCallback((page: number) => setTabPage(docId, page), [docId, setTabPage]);
  const onRightPage = useCallback((page: number) => setTabSplit(docId, { rightPage: page }), [docId, setTabSplit]);

  const onLeftScale = useCallback((scale: number) => setScales((s) => ({ ...s, left: scale })), []);
  const onRightScale = useCallback((scale: number) => setScales((s) => ({ ...s, right: scale })), []);

  const goToPage = useCallback((page: number) => paneRefs[currentPane].current?.goToPage(page), [currentPane]);

  // Switch between pages-in-pairs ("ต่อกัน") and two independent panes ("อิสระ").
  const setLinked = (next: boolean) => {
    if (next) {
      setTabSplit(docId, { linked: true });
      setActivePane('left');
      scrollPositions.delete(paneKey(docId, 'right'));
    } else {
      // The right pane starts on the page that was on the right of the current pair.
      setTabSplit(docId, { linked: false, rightPage: clampPage(tab.page + 1) });
    }
  };

  const toggleSplit = () => {
    if (split) {
      setTabSplit(docId, { split: false });
      setActivePane('left');
      scrollPositions.delete(paneKey(docId, 'right'));
    } else {
      setTabSplit(docId, { split: true, linked: true, rightPage: clampPage(tab.page + 1) });
    }
  };

  // Keyboard: ← / → turn pages of the active pane, Ctrl+Z undoes the last stroke.
  const { undo } = annotations;
  const activePage = panePage(currentPane);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]');
      if (typing || event.altKey) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') undo();
      else if (event.ctrlKey || event.metaKey) return;
      else if (event.key === 'ArrowRight') goToPage(activePage + pageStep);
      else if (event.key === 'ArrowLeft') goToPage(activePage - pageStep);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToPage, activePage, pageStep, undo]);

  // Full screen = the whole board, so tabs and tools stay available while focusing.
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    const board = rootRef.current?.closest('.board') ?? rootRef.current;
    board?.requestFullscreen().catch(() => showError('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจอ'));
  };

  const scale = scales[currentPane];
  const zoomTo = (next: number) =>
    setTabZoom(docId, Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)) * 100) / 100);

  const handleExport = async () => {
    setExporting(true);
    try {
      const name = documents.find((doc) => doc.id === docId)?.original_name ?? 'document.pdf';
      await exportAnnotatedPdf(docId, name, annotations.strokes);
    } catch (err) {
      console.error(err);
      showError('สร้างไฟล์ PDF ไม่สำเร็จ (ไฟล์ที่มีรหัสผ่านอาจ export ไม่ได้)');
    } finally {
      setExporting(false);
    }
  };

  const renderToolbar = (vertical: boolean, leading?: ReactNode) => (
    <ViewerToolbar
      page={activePage}
      pageStep={pageStep}
      pageCount={pageCount}
      scalePercent={Math.round(scale * 100)}
      isFit={tab.zoom === 'fit'}
      onGoTo={goToPage}
      onZoomIn={() => zoomTo(scale * ZOOM_STEP)}
      onZoomOut={() => zoomTo(scale / ZOOM_STEP)}
      onZoomTo={(percent) => zoomTo(percent / 100)}
      onFit={() => setTabZoom(docId, 'fit')}
      onRotate={() => rotateTab(docId)}
      isSplit={split}
      onToggleSplit={toggleSplit}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
      vertical={vertical}
      leading={leading}
    >
      <AnnotationTools
        canUndo={annotations.canUndo}
        onUndo={annotations.undo}
        exporting={exporting}
        onExport={handleExport}
      />
    </ViewerToolbar>
  );

  if (error) {
    return <div className="viewer-message">{error}</div>;
  }

  if (!loaded) {
    return <div className="viewer-message">กำลังเปิดเอกสาร…</div>;
  }

  const common = { loaded, zoom: tab.zoom, rotation, annotations };

  return (
    <div className="pdf-viewer" ref={rootRef}>
      <div className={`pdf-panes ${independent ? 'split' : ''}`}>
        <PdfPane
          {...common}
          ref={paneRefs.left}
          spread={spread}
          page={panePage('left')}
          onPageChange={onLeftPage}
          positionKey={paneKey(docId, 'left')}
          onScaleChange={onLeftScale}
          active={independent && activePane === 'left'}
          onActivate={() => setActivePane('left')}
          header={
            spread ? (
              <PaneHeader label="สองหน้า" linked onToggleLink={() => setLinked(false)} />
            ) : (
              independent && (
                <PaneHeader
                  label="ซ้าย"
                  page={panePage('left')}
                  pageCount={pageCount}
                  active={activePane === 'left'}
                  onGoTo={(page) => {
                    setActivePane('left');
                    paneRefs.left.current?.goToPage(page);
                  }}
                />
              )
            )
          }
        />
        {independent && (
          <PdfPane
            {...common}
            ref={paneRefs.right}
            page={panePage('right')}
            onPageChange={onRightPage}
            positionKey={paneKey(docId, 'right')}
            onScaleChange={onRightScale}
            active={activePane === 'right'}
            onActivate={() => setActivePane('right')}
            header={
              <PaneHeader
                label="ขวา"
                page={panePage('right')}
                pageCount={pageCount}
                active={activePane === 'right'}
                linked={false}
                onToggleLink={() => setLinked(true)}
                onGoTo={(page) => {
                  setActivePane('right');
                  paneRefs.right.current?.goToPage(page);
                }}
              />
            }
          />
        )}
      </div>

      {isFullscreen ? (
        <FloatingToolbarDock>{(vertical, grip) => renderToolbar(vertical, grip)}</FloatingToolbarDock>
      ) : (
        renderToolbar(false)
      )}
    </div>
  );
}
