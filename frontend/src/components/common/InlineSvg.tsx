import { useEffect, useRef } from 'react';

interface InlineSvgProps {
  src: string;
  className?: string;
  // Called once the SVG markup is in the DOM, so callers can query its element ids.
  onLoad?: (svg: SVGSVGElement) => void;
}

// Inlines an SVG file so its inner groups (#HEAD, #TREE1, ...) can be animated with CSS/JS.
export default function InlineSvg({ src, className, onLoad }: InlineSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${src}`);
        return response.text();
      })
      .then((markup) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        container.innerHTML = markup;
        const svg = container.querySelector('svg');
        if (svg) onLoadRef.current?.(svg);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [src]);

  return <div ref={containerRef} className={className} />;
}
