import { useCallback, useEffect, useRef } from 'react';
import InlineSvg from '../common/InlineSvg';
import './DeskScene.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Right-hand page of #BOOK_READ in the SVG's user units; it turns over the spine at x = SPINE_X.
const SPINE_X = 1241.3;
const RIGHT_PAGE = [
  [1241.3, 3187.4],
  [1534.3, 3182.7],
  [1659.7, 3436.4],
  [1241.3, 3439.1],
];
const PAGE_LINES = [3215, 3245, 3276, 3307, 3338, 3369, 3400];

const FLIP_MS = 1800; // one page turn
const PAUSE_MS = 4200; // reading time between turns

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const shade = (amount: number) => {
  const v = Math.round(255 - 26 * amount); // white → light grey while the page stands up
  return `rgb(${v},${v},${v})`;
};

// Adds a page that keeps turning from right to left over the open book.
function startPageTurning(svg: SVGSVGElement): () => void {
  const book = svg.querySelector('#BOOK_READ');
  if (!book) return () => {};

  const page = document.createElementNS(SVG_NS, 'g');
  page.setAttribute('class', 'turning-page');
  const sheet = document.createElementNS(SVG_NS, 'polygon');
  sheet.setAttribute('points', RIGHT_PAGE.map(([x, y]) => `${x},${y}`).join(' '));
  sheet.setAttribute('stroke', '#c8c8c8');
  sheet.setAttribute('stroke-width', '8');
  sheet.setAttribute('stroke-linejoin', 'round');
  page.appendChild(sheet);
  PAGE_LINES.forEach((y) => {
    const line = document.createElementNS(SVG_NS, 'line');
    // Lines follow the page's slanted outer edge.
    const outer = 1534 + ((y - 3183) / (3437 - 3183)) * (1660 - 1534) - 25;
    line.setAttribute('x1', String(SPINE_X + 35));
    line.setAttribute('x2', String(outer));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', '#d4d4d4');
    line.setAttribute('stroke-width', '2');
    page.appendChild(line);
  });
  book.appendChild(page);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let cycleStart = performance.now();

  const render = (now: number) => {
    const elapsed = (now - cycleStart) % (PAUSE_MS + FLIP_MS);
    const t = elapsed < PAUSE_MS ? 0 : easeInOut((elapsed - PAUSE_MS) / FLIP_MS);
    const scaleX = Math.cos(t * Math.PI); // 1 (right page) → -1 (lying on the left page)
    const lift = Math.sin(t * Math.PI); // highest when the page stands upright
    page.setAttribute(
      'transform',
      `translate(${SPINE_X} ${-14 * lift}) scale(${scaleX} 1) translate(${-SPINE_X} 0)`
    );
    sheet.setAttribute('fill', shade(lift));
    page.style.opacity = t === 0 ? '0' : '1'; // hidden while resting on the right page
    frame = requestAnimationFrame(render);
  };

  if (!reduceMotion) {
    cycleStart = performance.now();
    frame = requestAnimationFrame(render);
  } else {
    page.style.opacity = '0';
  }

  return () => {
    cancelAnimationFrame(frame);
    page.remove();
  };
}

// Thai time (Asia/Bangkok) as HH:MM, whatever the computer's own time zone is.
const thaiTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// Writes the current Thai time onto the #CLOCK display; the colon blinks every second.
function startClock(svg: SVGSVGElement): () => void {
  const clock = svg.querySelector<SVGRectElement>('#CLOCK');
  if (!clock) return () => {};
  const x = Number(clock.getAttribute('x')) + Number(clock.getAttribute('width')) / 2;
  const y = Number(clock.getAttribute('y')) + Number(clock.getAttribute('height')) / 2;

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('class', 'clock-digits');
  text.setAttribute('x', String(x));
  text.setAttribute('y', String(y));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  clock.after(text);

  const tick = () => {
    const [hours, minutes] = thaiTime.format(new Date()).split(':');
    const colonOn = new Date().getSeconds() % 2 === 0;
    text.textContent = `${hours}${colonOn ? ':' : ' '}${minutes}`;
  };
  tick();
  const timer = window.setInterval(tick, 1000);

  return () => {
    window.clearInterval(timer);
    text.remove();
  };
}

// Turns the #SPEKER1 drawing into a button (click, Enter or Space).
function makeSpeakerButton(svg: SVGSVGElement, onPress: () => void): SVGElement | null {
  const speaker = svg.querySelector<SVGElement>('#SPEKER1');
  if (!speaker) return null;
  speaker.setAttribute('role', 'button');
  speaker.setAttribute('tabindex', '0');
  speaker.addEventListener('click', onPress);
  speaker.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  });
  return speaker;
}

function labelSpeaker(speaker: SVGElement, panelOpen: boolean) {
  const label = panelOpen ? 'ซ่อนแผงเสียงบรรยากาศ' : 'เปิดแผงเสียงบรรยากาศ';
  speaker.setAttribute('aria-label', label);
  speaker.setAttribute('aria-pressed', String(panelOpen));
  let title = speaker.querySelector<SVGTitleElement>(':scope > title');
  if (!title) {
    title = document.createElementNS(SVG_NS, 'title');
    speaker.prepend(title);
  }
  title.textContent = label; // hover tooltip
}

interface DeskSceneProps {
  panelOpen: boolean;
  onSpeakerClick: () => void;
}

// The reader's own desk under the board (book, pens, plant, speaker). The flower sways
// (CSS), the open book slowly turns its pages, the clock shows Thai time, and the
// speaker opens/closes the soundscape panel (bouncing on hover).
export default function DeskScene({ panelOpen, onSpeakerClick }: DeskSceneProps) {
  const stopRef = useRef<(() => void) | null>(null);
  const speakerRef = useRef<SVGElement | null>(null);
  const onSpeakerRef = useRef(onSpeakerClick);
  onSpeakerRef.current = onSpeakerClick;

  const handleLoad = useCallback((svg: SVGSVGElement) => {
    stopRef.current?.();
    const stopPages = startPageTurning(svg);
    const stopClock = startClock(svg);
    speakerRef.current = makeSpeakerButton(svg, () => onSpeakerRef.current());
    if (speakerRef.current) labelSpeaker(speakerRef.current, panelOpenRef.current);
    stopRef.current = () => {
      stopPages();
      stopClock();
    };
  }, []);

  useEffect(() => () => stopRef.current?.(), []);

  // Keep the speaker's label and state in step with the panel.
  const panelOpenRef = useRef(panelOpen);
  panelOpenRef.current = panelOpen;
  useEffect(() => {
    if (speakerRef.current) labelSpeaker(speakerRef.current, panelOpen);
  }, [panelOpen]);

  return (
    <div className="desk-frame">
      <InlineSvg src="/assets/reading-desk.svg" className="desk-art" onLoad={handleLoad} />
    </div>
  );
}
