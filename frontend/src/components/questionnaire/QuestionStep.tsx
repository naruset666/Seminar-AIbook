import type { Question } from '../../types';
import './QuestionStep.css';

interface QuestionStepProps {
  question: Question;
  index: number; // 0-based
  total: number;
  selected: string | undefined;
  onSelect: (value: string) => void;
}

export default function QuestionStep({ question, index, total, selected, onSelect }: QuestionStepProps) {
  return (
    <section className="question-step">
      <p className="q-label">
        คำถามที่ {index + 1} จาก {total} · {question.label}
      </p>
      <h2 className="q-title">{question.text}</h2>

      <div className="q-options" role="radiogroup" aria-label={question.text}>
        {question.options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`q-option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(option.value)}
            >
              <span className="q-option-dot" />
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="q-basis">
        <b>เหตุผลของคำถาม:</b> {question.basis}
        <span className="q-ref">{question.references}</span>
      </p>
    </section>
  );
}
