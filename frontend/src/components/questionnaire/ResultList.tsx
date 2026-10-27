import type { PlaceMatch, Question } from '../../types';
import './ResultList.css';

interface ResultListProps {
  results: PlaceMatch[];
  questions: Question[];
  selectedPresetId: string | null;
  savingPresetId: string | null;
  onSelect: (presetId: string) => void;
}

export default function ResultList({ results, questions, selectedPresetId, savingPresetId, onSelect }: ResultListProps) {
  return (
    <ol className="result-list">
      {results.map(({ preset, score, hits }, i) => {
        const isSelected = preset.id === selectedPresetId;
        return (
          <li key={preset.id} className={`result-card ${i === 0 ? 'rank-1' : ''}`}>
            <div className="result-rank">{i + 1}</div>

            <div className="result-body">
              <div className="result-head">
                <h3 className="result-name">{preset.name}</h3>
                {i === 0 && <span className="result-badge">แนะนำ</span>}
              </div>
              <p className="result-score">ตรงกับคำตอบของคุณ {score} จาก {questions.length} ด้าน</p>
              <p className="result-desc">{preset.description}</p>

              <div className="result-why">
                {questions.map((question) => (
                  <span key={question.id} className={hits[question.id] ? 'hit' : ''}>
                    {hits[question.id] ? '✓ ' : ''}
                    {question.dimension}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`result-select ${isSelected ? 'selected' : ''}`}
              disabled={isSelected || savingPresetId !== null}
              onClick={() => onSelect(preset.id)}
            >
              {isSelected ? '✓ ใช้อยู่' : savingPresetId === preset.id ? 'กำลังบันทึก…' : 'ใช้บรรยากาศนี้'}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
