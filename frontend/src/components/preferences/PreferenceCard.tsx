import { useState, type FormEvent } from 'react';
import ResultList from '../questionnaire/ResultList';
import type { Question, QuestionnaireResponse } from '../../types';
import './PreferenceCard.css';

interface PreferenceCardProps {
  preference: QuestionnaireResponse;
  fallbackName: string; // shown when the user has not named this mood
  questions: Question[];
  isActive: boolean;
  busy: boolean;
  onUse: (presetId: string) => Promise<void>;
  onRename: (label: string) => Promise<void>;
  onDelete: () => void;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function PreferenceCard({
  preference,
  fallbackName,
  questions,
  isActive,
  busy,
  onUse,
  onRename,
  onDelete,
}: PreferenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(preference.label ?? '');
  const [savingPresetId, setSavingPresetId] = useState<string | null>(null);

  const chosen = preference.chosen_preset ?? preference.preset;
  const name = preference.label || fallbackName;

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    await onRename(draft.trim());
    setEditing(false);
  };

  const handleChoose = async (presetId: string) => {
    setSavingPresetId(presetId);
    try {
      await onUse(presetId);
    } finally {
      setSavingPresetId(null);
    }
  };

  return (
    <article className={`pref-card ${isActive ? 'active' : ''}`}>
      <header className="pref-header">
        {editing ? (
          <form className="pref-rename" onSubmit={handleRename}>
            <input
              autoFocus
              maxLength={40}
              placeholder="ตั้งชื่อ mood เช่น อ่านสอบ, อ่านชิล ๆ"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" disabled={busy}>บันทึก</button>
            <button type="button" className="ghost" onClick={() => setEditing(false)}>ยกเลิก</button>
          </form>
        ) : (
          <div className="pref-title-row">
            <h2 className="pref-name">{name}</h2>
            <button type="button" className="pref-edit" aria-label="ตั้งชื่อ mood" onClick={() => setEditing(true)}>
              ✎
            </button>
            {isActive && <span className="pref-active-badge">ใช้อยู่</span>}
          </div>
        )}
        <p className="pref-date">ทำแบบทดสอบเมื่อ {formatDateTime(preference.created_at)}</p>
      </header>

      <div className="pref-summary">
        <div className="pref-chosen">
          <span className="pref-chosen-label">บรรยากาศที่เลือก</span>
          <strong>{chosen?.name ?? '—'}</strong>
          {chosen && <p>{chosen.description}</p>}
        </div>

        <div className="pref-chips">
          {preference.results.map(({ preset, score }) => (
            <span key={preset.id} className={preset.id === chosen?.id ? 'chosen' : ''}>
              {preset.name} · {score}/{questions.length}
            </span>
          ))}
        </div>
      </div>

      <div className="pref-actions">
        <button
          type="button"
          className="pref-btn primary"
          disabled={isActive || busy || !chosen}
          onClick={() => chosen && handleChoose(chosen.id)}
        >
          {isActive ? '✓ ใช้ mood นี้อยู่' : 'ใช้ mood นี้'}
        </button>
        <button type="button" className="pref-btn ghost" onClick={() => setExpanded((open) => !open)}>
          {expanded ? 'ซ่อนผลลัพธ์' : 'เปลี่ยนสถานที่ / ดูผลลัพธ์'}
        </button>
        <button type="button" className="pref-btn danger" disabled={busy} onClick={onDelete}>
          ลบ
        </button>
      </div>

      {expanded && (
        <div className="pref-results">
          <ResultList
            results={preference.results}
            questions={questions}
            selectedPresetId={isActive ? chosen?.id ?? null : null}
            savingPresetId={savingPresetId}
            onSelect={handleChoose}
          />
        </div>
      )}
    </article>
  );
}
