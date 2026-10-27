// Builds a copy of the original PDF with the user's strokes drawn in as vector paths,
// then downloads it. The original text stays selectable/searchable in the export.
import { documentsApi } from '../api/documents';
import { HIGHLIGHT_OPACITY, STROKE_WIDTH } from './annotationStyle';
import type { PageStrokes } from '../types';
import { getPdf } from './pdfCache';

const hexToRgb01 = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

export async function exportAnnotatedPdf(docId: number, fileName: string, strokes: PageStrokes): Promise<void> {
  // pdf-lib is only needed here, so load it on demand.
  const [{ PDFDocument, rgb, LineCapStyle, LineJoinStyle, BlendMode, setLineJoin }, bytes, { pdf }] =
    await Promise.all([import('pdf-lib'), documentsApi.fileBytes(docId), getPdf(docId)]);

  const output = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = output.getPages();

  for (const [pageKey, list] of Object.entries(strokes)) {
    const pageIndex = Number(pageKey) - 1;
    if (!list.length || !pages[pageIndex]) continue;

    // Stroke points are PDF.js viewport units at scale 1; the viewport converts them
    // to PDF user space (bottom-left origin, honours CropBox offset and page rotation).
    const viewport = (await pdf.getPage(pageIndex + 1)).getViewport({ scale: 1 });
    const page = pages[pageIndex];
    page.pushOperators(setLineJoin(LineJoinStyle.Round));

    for (const stroke of list) {
      const pdfPoints = stroke.points.map(([x, y]) => viewport.convertToPdfPoint(x, y) as [number, number]);
      if (pdfPoints.length === 1) pdfPoints.push([pdfPoints[0][0] + 0.01, pdfPoints[0][1]]);
      // drawSvgPath flips the y axis, so negate y to stay in PDF user space.
      const path = pdfPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${-y}`).join(' ');
      const isHighlight = stroke.tool === 'highlight';
      page.drawSvgPath(path, {
        x: 0,
        y: 0,
        borderColor: rgb(...hexToRgb01(stroke.color)),
        borderWidth: stroke.width || STROKE_WIDTH[stroke.tool],
        borderOpacity: isHighlight ? HIGHLIGHT_OPACITY : 1,
        borderLineCap: LineCapStyle.Round,
        blendMode: isHighlight ? BlendMode.Multiply : undefined,
      });
    }
  }

  const data = await output.save();
  const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/\.pdf$/i, '')} (annotated).pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
