import './MenuButton.css';

interface MenuButtonProps {
  open: boolean;
  onToggle: () => void;
  label?: string;
}

// Round three-line menu button shared by the navbar and the floating menu.
// The lines turn into an X while the menu is open.
export default function MenuButton({ open, onToggle, label = 'เมนู' }: MenuButtonProps) {
  return (
    <button
      type="button"
      className={`menu-toggle ${open ? 'open' : ''}`}
      aria-label={label}
      aria-expanded={open}
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
