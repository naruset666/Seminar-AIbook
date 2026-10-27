import { useRef, useState, type DragEvent } from 'react';
import { useReader } from '../../store/ReaderContext';
import SoundPanel from '../soundscape/SoundPanel';
import LibraryView from './LibraryView';
import PdfViewer from './PdfViewer';
import TabBar from './TabBar';
import './ReadingBoard.css';

interface ReadingBoardProps {
  panelOpen: boolean;
  onTogglePanel: (open: boolean) => void;
}

// The cork board: tabs on top, the active PDF (or the library) inside, and the
// soundscape panel on the right (opened from the ♪ sticky note or the speaker on the desk).
// Dropping PDF files anywhere on the board uploads them.
export default function ReadingBoard({ panelOpen, onTogglePanel }: ReadingBoardProps) {
  const { tabs, activeDocId, error, clearError, uploadFiles, upload } = useReader();
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0); // dragenter/leave fire for every child element

  const activeTab = tabs.find((tab) => tab.docId === activeDocId) ?? null;
  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

  const onDragEnter = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) setDragging(false);
  };
  const onDrop = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!upload) uploadFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section
      className="board"
      onDragEnter={onDragEnter}
      onDragOver={(event) => hasFiles(event) && event.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="board-polaroid" aria-hidden="true" />
      <button
        type="button"
        className={`board-sticky ${panelOpen ? 'open' : ''}`}
        onClick={() => onTogglePanel(!panelOpen)}
        aria-pressed={panelOpen}
        aria-label={panelOpen ? 'ซ่อนแผงเสียงบรรยากาศ' : 'เปิดแผงเสียงบรรยากาศ'}
        title={panelOpen ? 'ซ่อนแผงเสียงบรรยากาศ' : 'เปิดแผงเสียงบรรยากาศ'}
      >
        ♪
      </button>

      {tabs.length > 0 && <TabBar />}

      <div className="board-body">
        <div className="board-surface">
          {activeTab ? <PdfViewer key={activeTab.docId} tab={activeTab} /> : <LibraryView />}
        </div>
        {panelOpen && <SoundPanel onClose={() => onTogglePanel(false)} />}
      </div>

      {error && (
        <div className="board-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="ปิดข้อความ">
            ×
          </button>
        </div>
      )}

      {dragging && (
        <div className="board-drop">
          <p>วางไฟล์ PDF ที่นี่เพื่ออัปโหลด</p>
        </div>
      )}
    </section>
  );
}
