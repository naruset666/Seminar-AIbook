import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LoadedPdf } from '../../reader/pdfCache';
import type { Annotations } from '../../reader/useAnnotations';
import { useReader, type Rotation, type Zoom } from '../../store/ReaderContext';
import AnnotationLayer from './AnnotationLayer';
import PdfPage from './PdfPage';

const PAD = 24; // space around the page column (px)
const GAP = 16; // space between pages (px)
export const MIN_SCALE = 0.3;
export const MAX_SCALE = 4;
const MAX_FIT_SCALE = 1.4; // "fit width" stops here so pages stay a comfortable reading size

export interface PdfPaneHandle {
  goToPage: (page: number) => void;
}

interface PdfPaneProps {
  loaded: LoadedPdf;
  page: number; // page to show; changing it from outside scrolls the pane
  onPageChange: (page: number) => void; // page under the reader's eye changed by scrolling
  zoom: Zoom;
  rotation: Rotation;
  positionKey: string; // where this pane's reading position is remembered
  annotations: Annotations;
  onScaleChange: (scale: number) => void;
  active?: boolean;
  onActivate?: () => void;
  header?: ReactNode; // shown above the pages in two-page view
  spread?: boolean; // two pages side by side per row, scrolling together
}

// One continuous-scroll column of PDF pages. Every page gets a sized placeholder;
// only pages within about one screen of the viewport render a canvas.
// The reading position is kept as "page index + fraction" in the reader store, so it
// survives tab switches, zoom changes and window resizes.
const PdfPane = forwardRef<PdfPaneHandle, PdfPaneProps>(function PdfPane(
  { loaded, page, onPageChange, zoom, rotation, positionKey, annotations, onScaleChange, active, onActivate, header, spread = false },
  ref
) {
  const { scrollPositions, tool, toolColors } = useReader();
  const [containerWidth, setContainerWidth] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const shownPage = useRef(page); // last page this pane reported or scrolled to

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // On-screen page sizes at scale 1 (width/height swap when turned sideways).
  const sideways = rotation === 90 || rotation === 270;
  const pageSizes = useMemo(
    () => loaded.pageSizes.map((size) => (sideways ? { width: size.height, height: size.width } : size)),
    [loaded, sideways]
  );
  const maxPageWidth = useMemo(() => Math.max(1, ...pageSizes.map((size) => size.width)), [pageSizes]);
  const columns = spread ? 2 : 1;

  const scale = useMemo(() => {
    if (zoom !== 'fit') return zoom;
    if (!containerWidth) return 1;
    const available = containerWidth - PAD * 2 - (columns - 1) * GAP;
    return Math.min(MAX_FIT_SCALE, Math.max(MIN_SCALE, available / (maxPageWidth * columns)));
  }, [zoom, containerWidth, maxPageWidth, columns]);

  useEffect(() => onScaleChange(scale), [scale, onScaleChange]);

  // Pages are laid out in rows: one page per row, or two side by side in spread view.
  // `boxes` is per page; `rows` drives scrolling, so both pages of a spread move together.
  const layout = useMemo(() => {
    const rowCount = Math.ceil(pageSizes.length / columns);
    const rowSizes = Array.from({ length: rowCount }, (_, r) => {
      const sizes = pageSizes.slice(r * columns, r * columns + columns);
      return {
        width: sizes.reduce((sum, size) => sum + size.width * scale, 0) + (sizes.length - 1) * GAP,
        height: Math.max(...sizes.map((size) => size.height * scale)),
      };
    });
    const innerWidth = Math.max(containerWidth, Math.max(...rowSizes.map((row) => row.width)) + PAD * 2);

    const boxes: { top: number; left: number; width: number; height: number }[] = [];
    const rows: { top: number; height: number; first: number; last: number }[] = [];
    let top = PAD;
    rowSizes.forEach((row, r) => {
      const first = r * columns;
      const last = Math.min(first + columns, pageSizes.length) - 1;
      let left = (innerWidth - row.width) / 2;
      for (let i = first; i <= last; i++) {
        const width = pageSizes[i].width * scale;
        boxes.push({ top, left, width, height: pageSizes[i].height * scale });
        left += width + GAP;
      }
      rows.push({ top, height: row.height, first, last });
      top += row.height + GAP;
    });
    return { boxes, rows, totalHeight: top - GAP + PAD, innerWidth };
  }, [pageSizes, scale, containerWidth, columns]);

  // Index of the row that contains scroll offset y.
  const rowAt = useCallback(
    (y: number) => {
      const { rows } = layout;
      let lo = 0;
      let hi = rows.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (rows[mid].top <= y) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    },
    [layout]
  );

  const syncFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, clientHeight } = el;
    const { rows } = layout;

    // Reading position = first page index of the row + fraction of that row's slot.
    // Measured from PAD/2 below the scroll top, the same anchor scrollToPage uses, so a
    // freshly jumped-to page is stored as exactly "that page + 0".
    const anchor = scrollTop + PAD / 2;
    const row = rows[rowAt(anchor)];
    const fraction = Math.min(0.999, Math.max(0, (anchor - row.top) / (row.height + GAP)));
    scrollPositions.set(positionKey, row.first + fraction);

    // Render one screen above and below the viewport.
    const first = rows[rowAt(Math.max(0, scrollTop - clientHeight))].first;
    const last = rows[rowAt(scrollTop + clientHeight * 2)].last;
    setRange((prev) => (prev[0] === first && prev[1] === last ? prev : [first, last]));

    // The current page is the (first) page of the row under the upper third of the viewport.
    const current = rows[rowAt(scrollTop + clientHeight / 3)].first + 1;
    if (current !== shownPage.current) {
      shownPage.current = current;
      onPageChange(current);
    }
  }, [layout, rowAt, scrollPositions, positionKey, onPageChange]);

  // The frame callback must use the newest layout: a scroll event queued before a
  // layout change would otherwise be measured against the old page positions.
  const syncRef = useRef(syncFromScroll);
  syncRef.current = syncFromScroll;
  const handleScroll = () => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => syncRef.current());
  };
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Scrolls to the row holding `target`; returns the page now reported for that row.
  const scrollToPage = useCallback(
    (target: number) => {
      const el = scrollRef.current;
      const index = Math.min(Math.max(target, 1), layout.boxes.length) - 1;
      const row = layout.rows[Math.floor(index / columns)];
      if (el) el.scrollTop = row.top - PAD / 2;
      scrollPositions.set(positionKey, row.first);
      shownPage.current = row.first + 1;
      return row.first + 1;
    },
    [layout, columns, scrollPositions, positionKey]
  );

  // Re-apply the saved reading position whenever the layout changes
  // (first load, returning to this tab, zoom, resize, switching single/spread).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !containerWidth) return;
    const saved = scrollPositions.get(positionKey) ?? Math.min(page, layout.boxes.length) - 1;
    const index = Math.min(Math.floor(saved), layout.boxes.length - 1);
    const fraction = saved - Math.floor(saved);
    const row = layout.rows[Math.floor(index / columns)];
    el.scrollTop = row.top + fraction * (row.height + GAP) - PAD / 2;
    cancelAnimationFrame(frameRef.current);
    syncFromScroll();
    // Only layout changes should move the scroll position here.
  }, [layout]);

  // Follow page changes made from outside (toolbar, page field).
  useEffect(() => {
    if (page !== shownPage.current && containerWidth) scrollToPage(page);
  }, [page, containerWidth, scrollToPage]);

  useImperativeHandle(
    ref,
    () => ({
      goToPage: (target: number) => onPageChange(scrollToPage(target)),
    }),
    [scrollToPage, onPageChange]
  );

  const color = tool === 'highlight' || tool === 'pen' ? toolColors[tool] : '#000000';

  return (
    <div className={`pdf-pane ${active ? 'active' : ''}`} onPointerDownCapture={onActivate} onWheelCapture={onActivate}>
      {header}
      <div className="pdf-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="pdf-pages" style={{ height: layout.totalHeight, width: layout.innerWidth }}>
          {layout.boxes.map((box, i) => {
            const visible = i >= range[0] && i <= range[1];
            return (
              <div key={i} className="pdf-page-slot" style={{ top: box.top, left: box.left }}>
                <PdfPage
                  pdf={loaded.pdf}
                  pageNumber={i + 1}
                  scale={scale}
                  rotation={rotation}
                  width={box.width}
                  height={box.height}
                  render={visible}
                />
                {annotations.loaded && visible && (
                  <AnnotationLayer
                    baseWidth={loaded.pageSizes[i].width}
                    baseHeight={loaded.pageSizes[i].height}
                    width={box.width}
                    height={box.height}
                    scale={scale}
                    rotation={rotation}
                    strokes={annotations.strokes[i + 1]}
                    tool={tool}
                    color={color}
                    onAddStroke={(stroke) => annotations.addStroke(i + 1, stroke)}
                    onErase={(point, radius, gestureId) => annotations.eraseAt(i + 1, point, radius, gestureId)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default PdfPane;
