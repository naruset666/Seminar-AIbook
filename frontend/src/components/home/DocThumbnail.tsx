import { useEffect, useRef, useState } from 'react';
import { getPdf } from '../../reader/pdfCache';

interface DocThumbnailProps {
  docId: number;
  page: number;
  width: number; // CSS pixels
}

// Renders one PDF page as a small image, only once it is near the screen.
export default function DocThumbnail({ docId, page, width }: DocThumbnailProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let cancelRender: (() => void) | null = null;

    getPdf(docId)
      .then(async ({ pdf }) => {
        const pdfPage = await pdf.getPage(Math.min(Math.max(page, 1), pdf.numPages));
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const base = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: (width / base.width) * ratio });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const task = pdfPage.render({ canvasContext: canvas.getContext('2d')!, viewport });
        cancelRender = () => task.cancel();
        await task.promise;
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        if (err?.name !== 'RenderingCancelledException') console.error(err);
      });

    return () => {
      cancelled = true;
      cancelRender?.();
    };
  }, [near, docId, page, width]);

  return (
    <div ref={holderRef} className={`doc-thumb ${ready ? 'ready' : ''}`} style={{ width }}>
      <canvas ref={canvasRef} style={{ width }} />
    </div>
  );
}
