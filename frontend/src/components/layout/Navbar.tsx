import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import MenuButton from '../common/MenuButton';
import FloatingMenu from './FloatingMenu';
import './Navbar.css';

// Full-screen pages use the compact top-left menu instead of the navbar.
const COMPACT_PATHS = ['/reading'];

const NAV_LINKS = [
  { to: '/', label: 'home' },
  { to: '/reading', label: 'reading' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  if (COMPACT_PATHS.includes(pathname)) return <FloatingMenu />;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        U WANT READING?
      </Link>

      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="auth-links">
        {user ? (
          <div className="menu-wrapper" ref={menuRef}>
            <MenuButton open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} label="เมนูผู้ใช้" />

            <div className={`menu-dropdown ${menuOpen ? 'show' : ''}`}>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <span className="menu-icon">◯</span>
                <span>โปรไฟล์</span>
              </Link>
              <Link to="/preferences" onClick={() => setMenuOpen(false)}>
                <span className="menu-icon">☆</span>
                <span>ความชอบของคุณ</span>
              </Link>
              <button type="button" onClick={handleLogout}>
                <span className="menu-icon">↩</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="auth-button">
            LOGIN / REGISTER
          </Link>
        )}
      </div>
    </nav>
  );
}
