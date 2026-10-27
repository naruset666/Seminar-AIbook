import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import './FloatingToolbarDock.css';

const BOTTOM_ZONE = 90; // px from the bottom edge that reveals / recalls the toolbar
const SIDE_ZONE = 140; // dropping within this distance of a side docks the toolbar vertically
const HIDE_DELAY = 600;
const INTRO_MS = 1800; // show briefly on entering full screen so the user knows it exists

type Pin = { side: 'left' | 'right' } | { side: null; x: number; y: number };

interface FloatingToolbarDockProps {
  // Receives the layout and the drag handle to place inside the toolbar.
  children: (vertical: boolean, grip: ReactNode) => ReactNode;
}

// Full-screen toolbar behaviour:
// - docked at the bottom centre and hidden until the mouse nears the bottom edge;
// - can be dragged by its handle; dropping near the left/right edge docks it vertically,
//   anywhere else pins it at that spot — pinned toolbars stay visible;
// - moving the mouse back to the bottom edge returns it to the bottom dock.
export default function FloatingToolbarDock({ children }: FloatingToolbarDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState<Pin | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [nearBottom, setNearBottom] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [intro, setIntro] = useState(true);
  const [shown, setShown] = useState(true);
  // A pinned toolbar only returns to the bottom after the mouse has left the bottom zone once,
  // so a toolbar dropped low on the screen is not recalled immediately.
  const recallArmed = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onMove = (event: globalThis.PointerEvent) => {
      const near = event.clientY >= window.innerHeight - BOTTOM_ZONE;
      setNearBottom(near);
      if (!near) recallArmed.current = true;
    };
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  // Recall a pinned toolbar to the bottom dock.
  useEffect(() => {
    if (pin && nearBottom && !drag && recallArmed.current) setPin(null);
  }, [pin, nearBottom, drag]);

  // Bottom dock visibility, with a short delay before hiding.
  const wantVisible = pin !== null || drag !== null || nearBottom || hovered || focused || intro;
  useEffect(() => {
    if (wantVisible) {
      setShown(true);
      return;
    }
    const timer = window.setTimeout(() => setShown(false), HIDE_DELAY);
    return () => window.clearTimeout(timer);
  }, [wantVisible]);

  const onGripDown = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setDrag({ x: rect.left, y: rect.top });
  };

  const onGripMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const rect = dockRef.current?.getBoundingClientRect();
    const margin = 10; // keep the toolbar (and its shadow) fully on screen
    const maxX = window.innerWidth - (rect?.width ?? 0) - margin;
    const maxY = window.innerHeight - (rect?.height ?? 0) - margin;
    setDrag({
      x: Math.min(Math.max(margin, event.clientX - dragOffset.current.x), Math.max(margin, maxX)),
      y: Math.min(Math.max(margin, event.clientY - dragOffset.current.y), Math.max(margin, maxY)),
    });
  };

  const onGripUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const x = event.clientX;
    let next: Pin;
    if (x <= SIDE_ZONE) next = { side: 'left' };
    else if (x >= window.innerWidth - SIDE_ZONE) next = { side: 'right' };
    else next = { side: null, x: drag.x, y: drag.y };
    recallArmed.current = event.clientY < window.innerHeight - BOTTOM_ZONE;
    setPin(next);
    setDrag(null);
  };

  const vertical = !drag && (pin?.side === 'left' || pin?.side === 'right');

  let placement = 'dock-bottom';
  let style: CSSProperties | undefined;
  if (drag) {
    placement = 'dock-dragging';
    style = { left: drag.x, top: drag.y };
  } else if (pin && pin.side !== null) {
    placement = `dock-${pin.side}`;
  } else if (pin) {
    placement = 'dock-free';
    style = { left: pin.x, top: pin.y };
  }

  const grip = (
    <button
      type="button"
      className="dock-grip"
      title="ลากเพื่อย้ายแถบเครื่องมือ (ชิดซ้าย/ขวาเพื่อตั้งแนวตั้ง)"
      aria-label="ย้ายแถบเครื่องมือ"
      onPointerDown={onGripDown}
      onPointerMove={onGripMove}
      onPointerUp={onGripUp}
      onPointerCancel={onGripUp}
    >
      <span />
      <span />
    </button>
  );

  return (
    <div
      ref={dockRef}
      className={`floating-dock ${placement} ${shown ? 'shown' : ''}`}
      style={style}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {children(vertical, grip)}
    </div>
  );
}
