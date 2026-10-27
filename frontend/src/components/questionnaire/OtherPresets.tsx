import { useState } from 'react';
import { presetsApi } from '../../api/presets';
import type { Preset } from '../../types';
import './OtherPresets.css';

interface OtherPresetsProps {
  excludeIds: string[]; // places already shown in the ranked results
  selectedPresetId: string | null;
  savingPresetId: string | null;
  onSelect: (presetId: string) => void;
}

// "Want something else?" link under the results: expands every other soundscape so the
// user can pick one that the questionnaire did not recommend.
export default function OtherPresets({ excludeIds, selectedPresetId, savingPresetId, onSelect }: OtherPresetsProps) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[] | null>(null);
  const [error, setError] = useState('');

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && presets === null) {
      presetsApi
        .list()
        .then(({ presets }) => setPresets(presets))
        .catch((err) => setError(err.message));
    }
  };

  const others = (presets ?? []).filter((preset) => !excludeIds.includes(preset.id));

  return (
    <div className="other-presets">
      <button type="button" className="other-toggle" onClick={toggle} aria-expanded={open}>
        {open ? 'ซ่อนบรรยากาศอื่น ๆ ▲' : 'สนใจบรรยากาศอื่น ๆ ไหม? กดตรงนี้เพื่อดูเสียงบรรยากาศทั้งหมดให้เลือก ▼'}
      </button>

      {open && (
        <div className="other-list">
          {error && <p className="other-error">{error}</p>}
          {presets === null && !error && <p className="other-loading">กำลังโหลด…</p>}
          {others.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <div key={preset.id} className={`other-card ${isSelected ? 'selected' : ''}`}>
                <div className="other-body">
                  <h3>{preset.name}</h3>
                  <p className="other-desc">{preset.description}</p>
                  <p className="other-layers">
                    เสียง: {preset.layers.map((layer) => layer.label).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  className={`result-select ${isSelected ? 'selected' : ''}`}
                  disabled={isSelected || savingPresetId !== null}
                  onClick={() => onSelect(preset.id)}
                >
                  {isSelected ? '✓ ใช้อยู่' : savingPresetId === preset.id ? 'กำลังบันทึก…' : 'ใช้บรรยากาศนี้'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
