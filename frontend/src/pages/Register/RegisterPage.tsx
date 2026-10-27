import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import '../../styles/auth-form.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(email, password, displayName);
      // New users go straight to the questionnaire (CLAUDE.md user flow).
      navigate('/questionnaire', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-box">
        <h1>Create account</h1>
        <p className="login-subtitle">สมัครสมาชิกเพื่ออ่านหนังสือ</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="displayName">Username</label>
            <input
              id="displayName"
              type="text"
              placeholder="Create your username"
              autoComplete="nickname"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create your password (6+ characters)"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'กำลังสมัคร…' : 'REGISTER'}
          </button>
        </form>

        <p className="register-text">
          Already have an account?
          <Link to="/login">LOGIN</Link>
        </p>
      </div>
    </main>
  );
}
