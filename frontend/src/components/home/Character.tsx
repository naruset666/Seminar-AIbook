import { useCallback, useEffect, useRef, useState } from 'react';
import InlineSvg from '../common/InlineSvg';
import './Character.css';

const IDLE_TEXT = 'click me please';
const ACTIVE_TEXT = 'Let reading togetherr!!!';

const WAVE_KEYFRAMES: Keyframe[] = [
  { transform: 'translateX(0) rotate(0deg)' },
  { transform: 'translateX(-5px) rotate(-3deg)' },
  { transform: 'translateX(-100px) rotate(-6deg)' },
  { transform: 'translateX(130px) rotate(5deg)' },
  { transform: 'translateX(-7px) rotate(-3deg)' },
  { transform: 'translateX(0) rotate(0deg)' },
];

// The reading character: idle animations come from CSS; clicking waves the hand
// and swaps the speech text for 2 seconds. showText=false hides the speech text.
export default function Character({ showText = true }: { showText?: boolean }) {
  const [text, setText] = useState(IDLE_TEXT);
  const [textVisible, setTextVisible] = useState(true);
  const partsRef = useRef<{ leftHand: Element; head: Element; face: Element } | null>(null);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const swapText = (next: string) => {
    setTextVisible(false);
    later(() => {
      setText(next);
      setTextVisible(true);
    }, 300);
  };

  const react = useCallback(() => {
    const parts = partsRef.current;
    if (!parts || busyRef.current) return;
    busyRef.current = true;

    swapText(ACTIVE_TEXT);
    parts.leftHand.animate(WAVE_KEYFRAMES, { duration: 1600, easing: 'ease-in-out' });

    // Restart the CSS reaction animation.
    for (const el of [parts.head, parts.face]) {
      el.classList.remove('react');
      void (el as HTMLElement).getBoundingClientRect();
      el.classList.add('react');
    }
    later(() => {
      parts.head.classList.remove('react');
      parts.face.classList.remove('react');
    }, 1700);

    later(() => {
      swapText(IDLE_TEXT);
      busyRef.current = false;
    }, 2000);
  }, []);

  const handleLoad = useCallback(
    (svg: SVGSVGElement) => {
      const leftHand = svg.querySelector('#LEFTHAND');
      const head = svg.querySelector('#HEAD');
      const face = svg.querySelector('#FACE');
      if (!leftHand || !head || !face) {
        console.error('character.svg is missing #LEFTHAND, #HEAD or #FACE');
        return;
      }
      partsRef.current = { leftHand, head, face };
      svg.addEventListener('click', react);
    },
    [react]
  );

  return (
    <>
      {showText && (
        <div className="character-text" style={{ opacity: textVisible ? 1 : 0 }}>
          {text}
        </div>
      )}
      <InlineSvg src="/assets/character.svg" className="character" onLoad={handleLoad} />
    </>
  );
}
