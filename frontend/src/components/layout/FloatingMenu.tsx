import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import MenuButton from '../common/MenuButton';
import './FloatingMenu.css';

const LINKS = [
  { to: '/', label: 'home', icon: '⌂' },
  { to: '/reading', label: 'reading', icon: '▤' },
  { to: '/profile', label: 'โปรไฟล์', icon: '◯' },
  { to: '/preferences', label: 'ความชอบของคุณ', icon: '☆' },
];

// Compact navigation for full-screen pages (the reading room): a round button in the
// top-right corner that opens the site menu as a dropdown.
export default function FloatingMenu() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="floating-menu" ref={menuRef}>
      <MenuButton open={open} onToggle={() => setOpen((value) => !value)} />

      <div className={`floating-menu-dropdown ${open ? 'show' : ''}`}>
        <p className="floating-menu-brand">U WANT READING?</p>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={() => setOpen(false)}
          >
            <span className="floating-menu-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
        <button type="button" onClick={handleLogout}>
          <span className="floating-menu-icon">↩</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  );
}
