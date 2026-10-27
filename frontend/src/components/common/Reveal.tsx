import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './Reveal.css';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // ms, for staggering items that appear together
}

// Slides its content up and fades it in when it scrolls into view. When the user scrolls
// back up past it (the element is below the screen again) it hides, so it plays every time.
export default function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
        else if (entry.boundingClientRect.top > 0) setVisible(false);
      },
      // Wait until the element is a little way into the screen, not just its top edge.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
