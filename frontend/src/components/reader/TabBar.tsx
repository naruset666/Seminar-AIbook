import { useReader } from '../../store/ReaderContext';
import './TabBar.css';

// Paper-tag tabs pinned along the top of the board.
export default function TabBar() {
  const { tabs, documents, activeDocId, openDoc, closeTab, showLibrary } = useReader();
  const names = new Map(documents.map((doc) => [doc.id, doc.original_name]));

  return (
    <div className="tab-bar" role="tablist">
      {tabs.map(({ docId }) => {
        const name = names.get(docId) ?? 'เอกสาร';
        const active = docId === activeDocId;
        return (
          <div key={docId} className={`tab ${active ? 'active' : ''}`} role="tab" aria-selected={active}>
            <button type="button" className="tab-name" title={name} onClick={() => openDoc(docId)}>
              {name.replace(/\.pdf$/i, '')}
            </button>
            <button type="button" className="tab-close" aria-label={`ปิด ${name}`} onClick={() => closeTab(docId)}>
              ×
            </button>
          </div>
        );
      })}

      <button
        type="button"
        className={`tab-add ${activeDocId === null ? 'active' : ''}`}
        title="คลังเอกสาร / อัปโหลด"
        aria-label="คลังเอกสาร / อัปโหลด"
        onClick={showLibrary}
      >
        +
      </button>
    </div>
  );
}
