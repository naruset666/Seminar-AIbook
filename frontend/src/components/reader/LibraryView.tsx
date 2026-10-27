import { useRef, type CSSProperties } from 'react';
import { MAX_FILE_MB, useReader } from '../../store/ReaderContext';
import type { DocumentInfo } from '../../types';
import './LibraryView.css';

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Shown on the board when no tab is active: the Upload button plus the user's documents.
export default function LibraryView() {
  const { documents, tabs, upload, loading, openDoc, uploadFiles, deleteDoc } = useReader();
  const inputRef = useRef<HTMLInputElement>(null);
  const openIds = new Set(tabs.map((tab) => tab.docId));

  const handleDelete = (doc: DocumentInfo) => {
    if (window.confirm(`ลบ "${doc.original_name}" ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) deleteDoc(doc.id);
  };

  return (
    <div className="library">
      <div className="library-upload">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = ''; // allow choosing the same file again
          }}
        />

        {upload ? (
          <div className="upload-progress" role="status">
            <p>กำลังอัปโหลด {upload.fileCount} ไฟล์… {upload.percent}%</p>
            <div className="upload-bar">
              <span style={{ width: `${upload.percent}%` }} />
            </div>
          </div>
        ) : (
          <button type="button" className="upload-button" onClick={() => inputRef.current?.click()}>
            Upload PDF
          </button>
        )}
        <p className="upload-hint">หรือลากไฟล์ PDF มาวางบนกระดาน · เลือกได้หลายไฟล์ · ไม่เกิน {MAX_FILE_MB} MB ต่อไฟล์</p>
      </div>

      {!loading && documents.length > 0 && (
        <section className="library-docs">
          <h2>เอกสารของคุณ</h2>
          <ul>
            {documents.map((doc, i) => (
              <li key={doc.id} className="doc-note" style={{ '--tilt': `${((i % 5) - 2) * 0.8}deg` } as CSSProperties}>
                <button type="button" className="doc-open" onClick={() => openDoc(doc.id)} title={doc.original_name}>
                  <span className="doc-pin" />
                  <span className="doc-name">{doc.original_name.replace(/\.pdf$/i, '')}</span>
                  <span className="doc-meta">
                    {doc.page_count ? `อ่านถึงหน้า ${doc.last_page}/${doc.page_count}` : 'ยังไม่ได้เปิดอ่าน'} · {formatSize(doc.size_bytes)}
                  </span>
                  {openIds.has(doc.id) && <span className="doc-open-badge">เปิดอยู่</span>}
                </button>
                <button type="button" className="doc-delete" aria-label={`ลบ ${doc.original_name}`} onClick={() => handleDelete(doc)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
