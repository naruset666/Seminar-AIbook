import { useEffect, useState, type FormEvent } from 'react';
import { LinkIcon } from './icons';
import './PaneHeader.css';

interface PaneHeaderProps {
  label: string;
  active?: boolean;
  // Page field (independent panes only; in paired view the toolbar handles paging).
  page?: number;
  pageCount?: number;
  onGoTo?: (page: number) => void;
  // Link toggle: linked = pages in pairs that scroll together.
  linked?: boolean;
  onToggleLink?: () => void;
}

// Small label chip above a pane in two-page view.
export default function PaneHeader({ label, active, page, pageCount, onGoTo, linked, onToggleLink }: PaneHeaderProps) {
  const [draft, setDraft] = useState(String(page ?? ''));
  useEffect(() => setDraft(String(page ?? '')), [page]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const n = Number.parseInt(draft, 10);
    if (onGoTo && pageCount && Number.isFinite(n) && n !== page) onGoTo(Math.min(Math.max(n, 1), pageCount));
    else setDraft(String(page ?? ''));
  };

  return (
    <div className="pane-header-row">
      <div className={`pane-header ${active ? 'active' : ''}`}>
        <span className="pane-label">{label}</span>
        {onGoTo && pageCount !== undefined && (
          <form className="pane-page" onSubmit={submit}>
            <input
              value={draft}
              inputMode="numeric"
              aria-label={`เลขหน้า${label}`}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={() => submit()}
              onFocus={(e) => e.target.select()}
            />
            <span className="pane-count">/ {pageCount}</span>
          </form>
        )}
        {onToggleLink && (
          <button
            type="button"
            className={`pane-link ${linked ? 'on' : ''}`}
            aria-pressed={linked}
            title={
              linked
                ? 'ต่อกัน: หน้าคู่เลื่อนไปพร้อมกัน (กดเพื่อแยกเลือกหน้าเองแต่ละฝั่ง)'
                : 'อิสระ: แต่ละฝั่งเลือกหน้าเอง (กดเพื่อกลับเป็นหน้าคู่ต่อกัน)'
            }
            onClick={onToggleLink}
          >
            <LinkIcon />
            {linked ? 'ต่อกัน' : 'อิสระ'}
          </button>
        )}
      </div>
    </div>
  );
}
