import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { questionnaireApi } from '../../api/questionnaire';
import { useAuth } from '../../store/AuthContext';
import '../../styles/auth-form.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      // CLAUDE.md user flow: users who never answered the questionnaire go there first.
      let target = from;
      if (!target) {
        const { latest } = await questionnaireApi.latest().catch(() => ({ latest: null }));
        target = latest ? '/reading' : '/questionnaire';
      }
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-box">
        <h1>Welcome back</h1>
        <p className="login-subtitle">เข้าสู่ระบบเพื่อนั่งโต๊ะอ่านหนังสือของคุณ</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'กำลังเข้าสู่ระบบ…' : 'LOGIN'}
          </button>
        </form>

        <p className="register-text">
          Don&apos;t have an account?
          <Link to="/register">REGISTER</Link>
        </p>
      </div>
    </main>
  );
}
