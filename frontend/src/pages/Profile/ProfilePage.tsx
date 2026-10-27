import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaireApi } from '../../api/questionnaire';
import { useAuth } from '../../store/AuthContext';
import type { QuestionnaireResponse, StimulationLevel } from '../../types';
import './ProfilePage.css';

const LEVEL_LABELS: Record<StimulationLevel, string> = {
  low: 'เงียบ',
  medium: 'มีเสียงเบา ๆ เป็นพื้นหลัง',
  high: 'มีเสียงรอบตัวพอสมควร',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [latest, setLatest] = useState<QuestionnaireResponse | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

  useEffect(() => {
    questionnaireApi
      .latest()
      .then(({ latest }) => setLatest(latest))
      .catch((err) => console.error(err))
      .finally(() => setLoadingLatest(false));
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const placeholder = loadingLatest ? '…' : '—';

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.display_name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <p className="profile-label">MY PROFILE</p>
            <h1>{user.display_name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{user.display_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member since</span>
              <span className="info-value">{formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>My Preferences</h2>
          <div className="preference-list">
            <div className="preference-item">
              <span>สถานที่อ่านที่แนะนำ</span>
              <strong className={latest?.preset ? 'filled' : ''}>
                {latest?.preset ? `${latest.preset.name} (ตรง ${latest.score}/5 ด้าน)` : placeholder}
              </strong>
            </div>
            <div className="preference-item">
              <span>ระดับเสียงรอบตัวที่ชอบ</span>
              <strong className={latest ? 'filled' : ''}>{latest ? LEVEL_LABELS[latest.level] : placeholder}</strong>
            </div>
            <div className="preference-item">
              <span>ทำแบบสอบถามล่าสุด</span>
              <strong className={latest ? 'filled' : ''}>
                {latest ? formatDate(latest.created_at) : placeholder}
              </strong>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="edit-button" onClick={() => navigate('/questionnaire')}>
            {latest ? 'ทำแบบสอบถามใหม่' : 'ทำแบบสอบถาม'}
          </button>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>
    </main>
  );
}
