import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsApi } from '../../api/documents';
import type { DocumentInfo } from '../../types';
import Reveal from '../common/Reveal';
import DocThumbnail from './DocThumbnail';
import './ContinueReading.css';

const MAX_CARDS = 6;
const THUMB_WIDTH = 300;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

// Most recently read first, then documents that were uploaded but never opened.
function sortForContinue(docs: DocumentInfo[]): DocumentInfo[] {
  return [...docs].sort((a, b) => {
    const aTime = Date.parse(a.last_opened_at ?? '') || 0;
    const bTime = Date.parse(b.last_opened_at ?? '') || 0;
    if (aTime !== bTime) return bTime - aTime;
    return Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at);
  });
}

// Home page section: the signed-in user's documents, each pinned on cork like the
// reading board and showing the page they stopped on. Clicking opens that document.
export default function ContinueReading() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentInfo[] | null>(null);

  useEffect(() => {
    documentsApi
      .list()
      .then(({ documents }) => setDocs(sortForContinue(documents).slice(0, MAX_CARDS)))
      .catch(() => setDocs([]));
  }, []);

  if (docs === null) return null;

  return (
    <section className="continue">
      <Reveal>
        <h2 className="continue-title">อ่านต่อจากที่ค้างไว้</h2>
      </Reveal>

      {docs.length === 0 ? (
        <Reveal delay={120}>
          <div className="continue-empty">
            <p>ยังไม่มีเอกสารที่อ่านค้างไว้</p>
            <Link to="/reading" className="continue-start">
              ไปห้องอ่านหนังสือ →
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="continue-grid">
          {docs.map((doc, i) => (
            <Reveal key={doc.id} delay={(i % 2) * 140}>
              <button
                type="button"
                className="continue-card"
                onClick={() => navigate('/reading', { state: { openDocId: doc.id } })}
              >
                <div className="continue-cork">
                  <span className="continue-pin" />
                  <div className="continue-paper" style={{ '--tilt': `${i % 2 === 0 ? -2 : 2}deg` } as CSSProperties}>
                    <DocThumbnail docId={doc.id} page={doc.last_page} width={THUMB_WIDTH} />
                  </div>
                </div>
                <h3 className="continue-name">{doc.original_name.replace(/\.pdf$/i, '')}</h3>
                <p className="continue-meta">
                  {doc.page_count ? `อ่านถึงหน้า ${doc.last_page} / ${doc.page_count}` : 'ยังไม่ได้เปิดอ่าน'}
                  {doc.last_opened_at && ` · เปิดล่าสุด ${formatDate(doc.last_opened_at)}`}
                </p>
              </button>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
