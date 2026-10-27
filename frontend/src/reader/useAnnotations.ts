import { useCallback, useEffect, useRef, useState } from 'react';
import { documentsApi } from '../api/documents';
import type { PageStrokes, Stroke } from '../types';

const SAVE_DELAY = 1000;
const MAX_UNDO = 50;

// Squared distance from point p to segment a-b.
function distanceToSegmentSq(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return x * x + y * y;
}

function strokeHit(stroke: Stroke, point: [number, number], radius: number): boolean {
  const reach = radius + stroke.width / 2;
  const reachSq = reach * reach;
  const { points } = stroke;
  if (points.length === 1) return distanceToSegmentSq(point, points[0], points[0]) <= reachSq;
  for (let i = 1; i < points.length; i++) {
    if (distanceToSegmentSq(point, points[i - 1], points[i]) <= reachSq) return true;
  }
  return false;
}

export interface Annotations {
  strokes: PageStrokes;
  loaded: boolean;
  saving: boolean;
  canUndo: boolean;
  addStroke: (page: number, stroke: Stroke) => void;
  // Whole-stroke eraser. Calls sharing a gestureId form one undo step.
  eraseAt: (page: number, point: [number, number], radius: number, gestureId: number) => void;
  undo: () => void;
}

// Loads, edits and auto-saves the strokes of one document.
export function useAnnotations(docId: number): Annotations {
  const [strokes, setStrokes] = useState<PageStrokes>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historySize, setHistorySize] = useState(0);
  const strokesRef = useRef<PageStrokes>({});
  const history = useRef<PageStrokes[]>([]);
  const lastEraseGesture = useRef<number | null>(null);
  const dirty = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    documentsApi
      .getAnnotations(docId)
      .then(({ strokes: saved }) => {
        if (cancelled) return;
        strokesRef.current = saved;
        setStrokes(saved);
      })
      .catch((err) => console.error('Loading annotations failed:', err))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [docId]);

  const save = useCallback(
    (keepalive = false) => {
      window.clearTimeout(saveTimer.current);
      if (!dirty.current) return;
      dirty.current = false;
      setSaving(true);
      documentsApi
        .saveAnnotations(docId, strokesRef.current, keepalive)
        .catch((err) => {
          console.error('Saving annotations failed:', err);
          dirty.current = true; // retry with the next change
        })
        .finally(() => setSaving(false));
    },
    [docId]
  );

  // Save whatever is pending when the tab closes or the page is left.
  useEffect(() => {
    const onPageHide = () => save(true);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      save(true);
    };
  }, [save]);

  const commit = useCallback(
    (next: PageStrokes, pushHistory: boolean) => {
      if (pushHistory) {
        history.current = [...history.current.slice(-(MAX_UNDO - 1)), strokesRef.current];
        setHistorySize(history.current.length);
      }
      strokesRef.current = next;
      setStrokes(next);
      dirty.current = true;
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => save(), SAVE_DELAY);
    },
    [save]
  );

  const addStroke = useCallback(
    (page: number, stroke: Stroke) => {
      const current = strokesRef.current;
      commit({ ...current, [page]: [...(current[page] ?? []), stroke] }, true);
    },
    [commit]
  );

  const eraseAt = useCallback(
    (page: number, point: [number, number], radius: number, gestureId: number) => {
      const current = strokesRef.current;
      const list = current[page];
      if (!list?.length) return;
      const remaining = list.filter((stroke) => !strokeHit(stroke, point, radius));
      if (remaining.length === list.length) return;

      const next = { ...current };
      if (remaining.length) next[page] = remaining;
      else delete next[page];
      commit(next, lastEraseGesture.current !== gestureId);
      lastEraseGesture.current = gestureId;
    },
    [commit]
  );

  const undo = useCallback(() => {
    const previous = history.current.pop();
    if (!previous) return;
    setHistorySize(history.current.length);
    lastEraseGesture.current = null;
    commit(previous, false);
  }, [commit]);

  return { strokes, loaded, saving, canUndo: historySize > 0, addStroke, eraseAt, undo };
}
