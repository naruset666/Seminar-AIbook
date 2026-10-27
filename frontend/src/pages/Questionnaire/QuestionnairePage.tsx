import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questionnaireApi } from '../../api/questionnaire';
import OtherPresets from '../../components/questionnaire/OtherPresets';
import ProgressBar from '../../components/questionnaire/ProgressBar';
import QuestionStep from '../../components/questionnaire/QuestionStep';
import ResultList from '../../components/questionnaire/ResultList';
import type { Answers, PlaceMatch, Question } from '../../types';
import './QuestionnairePage.css';

export default function QuestionnairePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(0); // index into questions
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [results, setResults] = useState<PlaceMatch[] | null>(null);
  const [responseId, setResponseId] = useState<number | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [savingPresetId, setSavingPresetId] = useState<string | null>(null);

  useEffect(() => {
    questionnaireApi
      .questions()
      .then(({ questions }) => setQuestions(questions))
      .catch((err) => setLoadError(err.message));
  }, []);

  const total = questions.length;
  const current = questions[step];
  const isLast = step === total - 1;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await questionnaireApi.submit(answers);
      setResults(result.results);
      setResponseId(result.response.id);
      // The backend makes the top match the active preset.
      setSelectedPresetId(result.results[0]?.preset.id ?? null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'ส่งคำตอบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChoosePreset = async (presetId: string) => {
    if (responseId === null) return;
    setSavingPresetId(presetId);
    try {
      // Saved on this preference and applied as the active preset.
      await questionnaireApi.update(responseId, { chosen_preset_id: presetId });
      setSelectedPresetId(presetId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingPresetId(null);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setResults(null);
    setResponseId(null);
    setSubmitError('');
    setStep(0);
  };

  if (loadError) {
    return (
      <main className="quiz-page">
        <div className="quiz-card">
          <p className="form-error">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!current) return null; // questions still loading

  return (
    <main className="quiz-page">
      <div className="quiz-intro">
        <p className="quiz-kicker">แบบทดสอบความชอบของคุณ</p>
        <h1>หาสถานที่อ่านหนังสือที่ใช่สำหรับคุณ</h1>
      </div>

      <div className="quiz-card">
        <ProgressBar current={results ? total + 1 : step + 1} total={total + 1} />

        {results ? (
          <section>
            <p className="q-label">ผลวิเคราะห์จากคำตอบของคุณ</p>
            <h2 className="q-title">สถานที่อ่านหนังสือที่เหมาะกับคุณ</h2>

            <ResultList
              results={results}
              questions={questions}
              selectedPresetId={selectedPresetId}
              savingPresetId={savingPresetId}
              onSelect={handleChoosePreset}
            />

            {submitError && <p className="form-error">{submitError}</p>}

            <p className="result-note">
              ระบบจับคู่คำตอบทั้ง {total} ข้อกับลักษณะเสียงของแต่ละสถานที่ คำถามแต่ละข้อออกแบบจากแนวคิดในงานวิจัยด้านเสียงกับการอ่าน
              ส่วนเกณฑ์การจับคู่เป็นค่าเริ่มต้นที่ทีมผู้จัดทำกำหนด และจะปรับปรุงจากข้อมูลผู้ใช้จริงในระยะถัดไป
            </p>
            <OtherPresets
              excludeIds={results.map((r) => r.preset.id)}
              selectedPresetId={selectedPresetId}
              savingPresetId={savingPresetId}
              onSelect={handleChoosePreset}
            />

            <p className="result-saved">
              ผลนี้ถูกเก็บไว้ใน <Link to="/preferences">ความชอบของคุณ</Link> แล้ว เลือกกลับมาใช้หรือตั้งชื่อ mood ได้ทีหลัง
            </p>

            <div className="quiz-nav">
              <button type="button" className="quiz-btn ghost" onClick={handleRestart}>
                ทำแบบสอบถามใหม่
              </button>
              <Link to="/reading" className="quiz-btn primary">
                เข้าห้องอ่านหนังสือ →
              </Link>
            </div>
          </section>
        ) : (
          <>
            <QuestionStep
              question={current}
              index={step}
              total={total}
              selected={answers[current.id]}
              onSelect={handleSelect}
            />

            {submitError && <p className="form-error">{submitError}</p>}

            <div className="quiz-nav">
              <button
                type="button"
                className="quiz-btn ghost"
                disabled={step === 0 || submitting}
                onClick={() => setStep((s) => s - 1)}
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                className="quiz-btn primary"
                disabled={!answers[current.id] || submitting}
                onClick={handleNext}
              >
                {submitting ? 'กำลังวิเคราะห์…' : isLast ? 'ดูผลลัพธ์' : 'ถัดไป'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
