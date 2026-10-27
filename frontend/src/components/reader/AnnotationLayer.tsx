import { memo, useRef, useState, type PointerEvent } from 'react';
import { HIGHLIGHT_OPACITY, STROKE_WIDTH } from '../../reader/annotationStyle';
import type { Rotation } from '../../store/ReaderContext';
import type { AnnotationTool, Stroke } from '../../types';
import './AnnotationLayer.css';

const ERASER_RADIUS_PX = 10;
const MIN_POINT_DISTANCE = 0.8; // skip points closer than this while drawing

let nextGestureId = 1;

interface AnnotationLayerProps {
  baseWidth: number; // page size at scale 1, before the user's rotation
  baseHeight: number;
  width: number; // on-screen size in CSS pixels
  height: number;
  scale: number;
  rotation: Rotation;
  strokes: Stroke[] | undefined;
  tool: AnnotationTool;
  color: string;
  onAddStroke: (stroke: Stroke) => void;
  onErase: (point: [number, number], radius: number, gestureId: number) => void;
}

// Maps page coordinates to the rotated view; pointer input goes back through the
// inverse of this transform (getScreenCTM), so strokes are always stored unrotated.
function rotationTransform(rotation: Rotation, w: number, h: number): string | undefined {
  switch (rotation) {
    case 90:
      return `translate(${h} 0) rotate(90)`;
    case 180:
      return `translate(${w} ${h}) rotate(180)`;
    case 270:
      return `translate(0 ${w}) rotate(270)`;
    default:
      return undefined;
  }
}

const toPath = (points: [number, number][]) =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('') +
  (points.length === 1 ? `L${points[0][0] + 0.01} ${points[0][1]}` : ''); // a dot still needs a segment

function StrokePath({ stroke }: { stroke: Stroke }) {
  return (
    <path
      d={toPath(stroke.points)}
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeOpacity={stroke.tool === 'highlight' ? HIGHLIGHT_OPACITY : 1}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function AnnotationLayer({
  baseWidth,
  baseHeight,
  width,
  height,
  scale,
  rotation,
  strokes,
  tool,
  color,
  onAddStroke,
  onErase,
}: AnnotationLayerProps) {
  const groupRef = useRef<SVGGElement>(null);
  const [draft, setDraft] = useState<[number, number][] | null>(null);
  const draftRef = useRef<[number, number][] | null>(null);
  const gestureRef = useRef(0);

  const sideways = rotation === 90 || rotation === 270;
  const active = tool !== 'read';

  // Pointer position in page units.
  const toPagePoint = (event: PointerEvent): [number, number] | null => {
    const matrix = groupRef.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
  };

  const erase = (event: PointerEvent) => {
    const point = toPagePoint(event);
    if (point) onErase(point, ERASER_RADIUS_PX / scale, gestureRef.current);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!active || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === 'eraser') {
      gestureRef.current = nextGestureId++;
      erase(event);
      return;
    }
    const point = toPagePoint(event);
    if (!point) return;
    draftRef.current = [point];
    setDraft([point]);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!active || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (tool === 'eraser') {
      erase(event);
      return;
    }
    const points = draftRef.current;
    const point = toPagePoint(event);
    if (!points || !point) return;
    const last = points[points.length - 1];
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < MIN_POINT_DISTANCE) return;
    const next = [...points, point];
    draftRef.current = next;
    setDraft(next);
  };

  const finish = () => {
    const points = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (points && (tool === 'pen' || tool === 'highlight')) {
      onAddStroke({ tool, color, width: STROKE_WIDTH[tool], points });
    }
  };

  return (
    <svg
      className={`annotation-layer tool-${tool}`}
      width={width}
      height={height}
      viewBox={`0 0 ${sideways ? baseHeight : baseWidth} ${sideways ? baseWidth : baseHeight}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <g ref={groupRef} transform={rotationTransform(rotation, baseWidth, baseHeight)}>
        {strokes?.map((stroke, i) => <StrokePath key={i} stroke={stroke} />)}
        {draft && (tool === 'pen' || tool === 'highlight') && (
          <StrokePath stroke={{ tool, color, width: STROKE_WIDTH[tool], points: draft }} />
        )}
      </g>
    </svg>
  );
}

export default memo(AnnotationLayer);
