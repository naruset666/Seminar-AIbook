import type { ReactNode } from 'react';
import { HIGHLIGHT_COLORS, PEN_COLORS, useReader } from '../../store/ReaderContext';
import type { AnnotationTool } from '../../types';
import { DownloadIcon, EraserIcon, HandIcon, HighlighterIcon, PenIcon, UndoIcon } from './icons';
import './AnnotationTools.css';

interface AnnotationToolsProps {
  canUndo: boolean;
  onUndo: () => void;
  exporting: boolean;
  onExport: () => void;
}

const TOOLS: { id: AnnotationTool; label: string; icon: ReactNode }[] = [
  { id: 'read', label: 'อ่าน / เลื่อนหน้า', icon: <HandIcon /> },
  { id: 'highlight', label: 'ไฮไลต์', icon: <HighlighterIcon /> },
  { id: 'pen', label: 'ปากกา', icon: <PenIcon /> },
  { id: 'eraser', label: 'ยางลบ (ลบทีละเส้น)', icon: <EraserIcon /> },
];

// Drawing tools: read / highlighter / pen / eraser, colour swatches, undo and export.
export default function AnnotationTools({ canUndo, onUndo, exporting, onExport }: AnnotationToolsProps) {
  const { tool, setTool, toolColors, setToolColor } = useReader();
  const palette = tool === 'highlight' ? HIGHLIGHT_COLORS : tool === 'pen' ? PEN_COLORS : null;

  return (
    <div className="toolbar-group annotation-tools">
      {TOOLS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`icon-button ${tool === item.id ? 'active' : ''}`}
          title={item.label}
          aria-label={item.label}
          aria-pressed={tool === item.id}
          onClick={() => setTool(item.id)}
        >
          {item.icon}
        </button>
      ))}

      {palette && (tool === 'highlight' || tool === 'pen') && (
        <div className="swatches" role="radiogroup" aria-label="สี">
          {palette.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={toolColors[tool] === color}
              aria-label={`สี ${color}`}
              className={`swatch ${toolColors[tool] === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => setToolColor(tool, color)}
            />
          ))}
        </div>
      )}

      <span className="toolbar-divider" />
      <button type="button" className="icon-button" title="ย้อนกลับ (Ctrl+Z)" aria-label="ย้อนกลับ" disabled={!canUndo} onClick={onUndo}>
        <UndoIcon />
      </button>
      <button type="button" className="export-button" title="ดาวน์โหลด PDF พร้อมไฮไลต์และเส้นที่เขียน" disabled={exporting} onClick={onExport}>
        <DownloadIcon />
        <span className="export-label">{exporting ? 'กำลังสร้าง…' : 'Export PDF'}</span>
      </button>
    </div>
  );
}
