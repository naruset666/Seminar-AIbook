import './ProgressBar.css';

interface ProgressBarProps {
  current: number; // 1-based step being shown
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="quiz-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < current ? 'filled' : ''} />
      ))}
    </div>
  );
}
