import { memo, useEffect, useRef } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number; // user rotation in degrees, added to the page's own rotation
  width: number; // CSS pixels, already scaled and rotated
  height: number;
  render: boolean; // false = keep the placeholder only (page is far off-screen)
}

// One PDF page. Its box always has the final size so scrolling stays stable;
// the canvas exists only while the page is near the viewport.
function PdfPage({ pdf, pageNumber, scale, rotation, width, height, render }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!render) return;
    let task: RenderTask | null = null;
    let cancelled = false;

    pdf.getPage(pageNumber).then((page) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * ratio, rotation: (page.rotate + rotation) % 360 });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: canvas.getContext('2d')!, viewport });
      task.promise.catch((err) => {
        if (err?.name !== 'RenderingCancelledException') console.error(err);
      });
    });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, scale, rotation, render]);

  return (
    <div className="pdf-page" style={{ width, height }} data-page={pageNumber}>
      {render ? (
        <canvas ref={canvasRef} style={{ width, height }} />
      ) : (
        <span className="pdf-page-number">{pageNumber}</span>
      )}
    </div>
  );
}

export default memo(PdfPage);
