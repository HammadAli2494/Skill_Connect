import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AnimatedShow } from './Motion';
import { RoleBadge } from './Status';

const MENUS = {
  customer: [
    { to: '/bookings', label: 'Customer dashboard' },
    { to: '/services', label: 'Browse Services' },
    { to: '/account', label: 'Manage Profile' },
    { to: '/notifications', label: 'Notifications' },
  ],
  provider: [
    { to: '/provider', label: 'Provider dashboard' },
    { to: '/provider/services', label: 'My Services' },
    { to: '/provider/services/new', label: 'Add Service' },
    { to: '/provider/bookings', label: 'Booking Requests' },
    { to: '/provider/profile', label: 'Manage Profile' },
    { to: '/notifications', label: 'Notifications' },
  ],
  admin: [
    { to: '/admin', label: 'Admin' },
    { to: '/notifications', label: 'Notifications' },
  ],
};

export function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const items = MENUS[user.role] || [];

  async function signOut() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-full items-center gap-2 rounded-md border border-line bg-card px-2 py-1"
      >
        <span className="max-w-36 truncate text-sm font-semibold text-ink sm:max-w-48">{user.name}</span>
        <RoleBadge role={user.role} />
        <span aria-hidden="true" className="text-xs text-muted">
          {open ? '▴' : '▾'}
        </span>
      </button>
      <AnimatedShow show={open} role="menu" className="absolute right-0 z-30 mt-2 w-64 border border-line bg-card py-1 shadow-card">
          <div className="border-b border-line px-3 py-3">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <div className="mt-2">
              <RoleBadge role={user.role} />
            </div>
          </div>
          {items.map((item) => (
            <Link
              key={item.label}
              role="menuitem"
              to={item.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-ink hover:bg-paper"
            >
              {item.label}
            </Link>
          ))}
          <button type="button" role="menuitem" onClick={signOut} className="block w-full px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-paper">
            Log out
          </button>
      </AnimatedShow>
    </div>
  );
}
