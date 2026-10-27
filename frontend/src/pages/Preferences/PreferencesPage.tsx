import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questionnaireApi } from '../../api/questionnaire';
import { settingsApi } from '../../api/settings';
import PreferenceCard from '../../components/preferences/PreferenceCard';
import type { Question, QuestionnaireResponse } from '../../types';
import './PreferencesPage.css';

// Saved preferences: every questionnaire attempt is kept so the user can switch moods later.
export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<QuestionnaireResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([questionnaireApi.history(), questionnaireApi.questions(), settingsApi.get()])
      .then(([{ preferences }, { questions }, { settings }]) => {
        setPreferences(preferences);
        setQuestions(questions);
        // The active mood is the newest one whose chosen place is the current preset.
        const active = preferences.find((p) => p.chosen_preset_id === settings.current_preset_id);
        setActiveId(active?.id ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const replace = (updated: QuestionnaireResponse) =>
    setPreferences((list) => list.map((p) => (p.id === updated.id ? updated : p)));

  const run = async (id: number, action: () => Promise<void>) => {
    setBusyId(id);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusyId(null);
    }
  };

  const handleUse = (id: number, presetId: string) =>
    run(id, async () => {
      const { preference } = await questionnaireApi.update(id, { chosen_preset_id: presetId });
      replace(preference);
      setActiveId(id);
    });

  const handleRename = (id: number, label: string) =>
    run(id, async () => {
      const { preference } = await questionnaireApi.update(id, { label: label || null });
      replace(preference);
    });

  const handleDelete = (preference: QuestionnaireResponse, name: string) => {
    if (!window.confirm(`ลบ "${name}" ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return;
    run(preference.id, async () => {
      await questionnaireApi.remove(preference.id);
      setPreferences((list) => list.filter((p) => p.id !== preference.id));
      if (activeId === preference.id) setActiveId(null);
    });
  };

  // Oldest attempt is "ครั้งที่ 1"; the list itself is newest first.
  const fallbackName = (index: number) => `ความชอบครั้งที่ ${preferences.length - index}`;

  return (
    <main className="prefs-page">
      <div className="prefs-head">
        <div>
          <p className="prefs-kicker">ความชอบของคุณ</p>
          <h1>เลือก mood การอ่านของวันนี้</h1>
          <p className="prefs-sub">
            ทุกครั้งที่ทำแบบทดสอบ ระบบจะเก็บผลไว้ที่นี่ เลือกกลับมาใช้ได้ทุกเมื่อ หรือตั้งชื่อ mood ให้จำง่าย
          </p>
        </div>
        <Link to="/questionnaire" className="prefs-new">
          + ทำแบบทดสอบใหม่
        </Link>
      </div>

      {error && <p className="prefs-error">{error}</p>}

      {loading ? (
        <p className="prefs-empty">กำลังโหลด…</p>
      ) : preferences.length === 0 ? (
        <div className="prefs-empty-card">
          <h2>ยังไม่มีความชอบที่บันทึกไว้</h2>
          <p>ทำแบบทดสอบ 5 ข้อ เพื่อให้ระบบแนะนำสถานที่อ่านหนังสือที่เหมาะกับคุณ</p>
          <Link to="/questionnaire" className="prefs-new">
            เริ่มทำแบบทดสอบ
          </Link>
        </div>
      ) : (
        <div className="prefs-list">
          {preferences.map((preference, index) => (
            <PreferenceCard
              key={preference.id}
              preference={preference}
              fallbackName={fallbackName(index)}
              questions={questions}
              isActive={preference.id === activeId}
              busy={busyId === preference.id}
              onUse={(presetId) => handleUse(preference.id, presetId)}
              onRename={(label) => handleRename(preference.id, label)}
              onDelete={() => handleDelete(preference, preference.label || fallbackName(index))}
            />
          ))}
        </div>
      )}
    </main>
  );
}
