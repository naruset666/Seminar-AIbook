import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ExitFullscreenIcon, FullscreenIcon, RotateIcon, SplitIcon } from './icons';
import './ViewerToolbar.css';

export const MIN_ZOOM_PERCENT = 30;
export const MAX_ZOOM_PERCENT = 400;

interface ViewerToolbarProps {
  page: number;
  pageStep?: number; // 2 when pages are shown in pairs
  pageCount: number;
  scalePercent: number;
  isFit: boolean;
  onGoTo: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomTo: (percent: number) => void;
  onFit: () => void;
  onRotate: () => void;
  isSplit: boolean;
  onToggleSplit: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  vertical?: boolean; // docked to the left/right edge in full screen
  leading?: ReactNode; // e.g. the drag handle of the floating dock
  children?: ReactNode; // extra toolbar groups (annotation tools)
}

// A number input that shows `value` until the user edits it, then commits on Enter/blur.
function useDraft(value: number, commit: (n: number) => void) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const n = Number.parseInt(draft, 10);
    if (Number.isFinite(n)) commit(n);
    setDraft(String(value)); // re-synced by the effect once the new value arrives
  };
  return { draft, setDraft: (text: string) => setDraft(text.replace(/\D/g, '').slice(0, 4)), submit };
}

export default function ViewerToolbar({
  page,
  pageStep = 1,
  pageCount,
  scalePercent,
  isFit,
  onGoTo,
  onZoomIn,
  onZoomOut,
  onZoomTo,
  onFit,
  onRotate,
  isSplit,
  onToggleSplit,
  isFullscreen,
  onToggleFullscreen,
  vertical = false,
  leading,
  children,
}: ViewerToolbarProps) {
  const pageDraft = useDraft(page, (n) => onGoTo(Math.min(Math.max(n, 1), pageCount)));
  const zoomDraft = useDraft(scalePercent, (n) =>
    onZoomTo(Math.min(Math.max(n, MIN_ZOOM_PERCENT), MAX_ZOOM_PERCENT))
  );

  return (
    <div className={`viewer-toolbar ${vertical ? 'vertical' : ''}`}>
      {leading}

      <div className="toolbar-group">
        <button type="button" onClick={() => onGoTo(page - pageStep)} disabled={page <= 1} aria-label="หน้าก่อนหน้า">
          ◀
        </button>
        <form onSubmit={pageDraft.submit} className="toolbar-field">
          <span className="toolbar-label">หน้า</span>
          <input
            value={pageDraft.draft}
            inputMode="numeric"
            aria-label="เลขหน้า"
            onChange={(e) => pageDraft.setDraft(e.target.value)}
            onBlur={() => pageDraft.submit()}
          />
          <span className="toolbar-suffix">/ {pageCount}</span>
        </form>
        <button type="button" onClick={() => onGoTo(page + pageStep)} disabled={page + pageStep > pageCount} aria-label="หน้าถัดไป">
          ▶
        </button>
      </div>

      <div className="toolbar-group">
        <button type="button" onClick={onZoomOut} aria-label="ซูมออก">−</button>
        <form onSubmit={zoomDraft.submit} className="toolbar-field" title={`พิมพ์ระดับซูม ${MIN_ZOOM_PERCENT}–${MAX_ZOOM_PERCENT} แล้วกด Enter`}>
          <input
            className="zoom-input"
            value={zoomDraft.draft}
            inputMode="numeric"
            aria-label="ระดับซูม (%)"
            onChange={(e) => zoomDraft.setDraft(e.target.value)}
            onBlur={() => zoomDraft.submit()}
            onFocus={(e) => e.target.select()}
          />
          <span className="toolbar-suffix">%</span>
        </form>
        <button type="button" onClick={onZoomIn} aria-label="ซูมเข้า">+</button>
        <button type="button" className={`toolbar-fit ${isFit ? 'active' : ''}`} onClick={onFit} title="พอดีความกว้าง">
          {vertical ? 'พอดี' : 'พอดีความกว้าง'}
        </button>
        <button type="button" className="icon-button" title="หมุนหน้า 90°" aria-label="หมุนหน้า" onClick={onRotate}>
          <RotateIcon />
        </button>
        <button
          type="button"
          className={`icon-button ${isSplit ? 'active' : ''}`}
          title={isSplit ? 'กลับเป็นหน้าเดียว' : 'แยกเป็นสองหน้า (ซ้าย/ขวาเลือกหน้าได้อิสระ)'}
          aria-label="แยกเป็นสองหน้า"
          aria-pressed={isSplit}
          onClick={onToggleSplit}
        >
          <SplitIcon />
        </button>
        <button
          type="button"
          className={`icon-button ${isFullscreen ? 'active' : ''}`}
          title={isFullscreen ? 'ออกจากโหมดเต็มจอ (Esc)' : 'เต็มจอ — โฟกัสการอ่าน'}
          aria-label={isFullscreen ? 'ออกจากโหมดเต็มจอ' : 'เต็มจอ'}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>

      {children}
    </div>
  );
}
