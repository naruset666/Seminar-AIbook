// Validates and normalises annotation strokes sent by the client before storing them.

const TOOLS = new Set(['pen', 'highlight']);
const COLOR = /^#[0-9a-f]{6}$/i;
const MAX_PAGES = 5000;
const MAX_STROKES_PER_PAGE = 2000;
const MAX_POINTS_PER_STROKE = 5000;

class AnnotationValidationError extends Error {}

const round = (n) => Math.round(n * 10) / 10;

function sanitizeStroke(stroke) {
  if (!stroke || !TOOLS.has(stroke.tool) || !COLOR.test(stroke.color)) {
    throw new AnnotationValidationError('รูปแบบเส้นไม่ถูกต้อง');
  }
  const width = Number(stroke.width);
  if (!Number.isFinite(width) || width <= 0 || width > 60) {
    throw new AnnotationValidationError('ความหนาเส้นไม่ถูกต้อง');
  }
  if (!Array.isArray(stroke.points) || stroke.points.length === 0 || stroke.points.length > MAX_POINTS_PER_STROKE) {
    throw new AnnotationValidationError('จุดของเส้นไม่ถูกต้อง');
  }
  const points = stroke.points.map((point) => {
    if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
      throw new AnnotationValidationError('พิกัดไม่ถูกต้อง');
    }
    return [round(point[0]), round(point[1])];
  });
  return { tool: stroke.tool, color: stroke.color.toLowerCase(), width: round(width), points };
}

// Returns {"<page>": [stroke, ...]} with empty pages dropped.
function sanitizeStrokes(strokes) {
  if (!strokes || typeof strokes !== 'object' || Array.isArray(strokes)) {
    throw new AnnotationValidationError('strokes ต้องเป็น object');
  }
  const pages = Object.entries(strokes);
  if (pages.length > MAX_PAGES) throw new AnnotationValidationError('จำนวนหน้ามากเกินไป');

  const clean = {};
  for (const [page, list] of pages) {
    if (!/^[1-9]\d*$/.test(page) || !Array.isArray(list) || list.length > MAX_STROKES_PER_PAGE) {
      throw new AnnotationValidationError('ข้อมูลหน้าไม่ถูกต้อง');
    }
    if (list.length > 0) clean[page] = list.map(sanitizeStroke);
  }
  return clean;
}

module.exports = { sanitizeStrokes, AnnotationValidationError };
