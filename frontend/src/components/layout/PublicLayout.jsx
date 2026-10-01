import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { AccountMenu } from '../common/AccountMenu';
import { AnimatedShow } from '../common/Motion';
import { useAuth } from '../../context/AuthContext';

const link = 'text-sm font-medium text-ink hover:text-forest';

export function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link to="/" className="font-serif text-xl tracking-tight text-forest">
          Skill Connect
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/services" className={link}>
            Browse services
          </Link>
          <a href="/#how-it-works" className={link}>
            How it works
          </a>
          {user ? null : (
            <Link to="/register?role=provider" className={link}>
              Offer a service
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/notifications" className={`${link} hidden md:inline`}>
                Notifications
              </Link>
              <AccountMenu />
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/login" className={link}>
                Log in
              </Link>
              <Link to="/register" className="rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white">
                Sign up
              </Link>
            </div>
          )}
          <button type="button" className="text-sm font-semibold md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      <AnimatedShow show={open} className="flex flex-col gap-3 border-t border-line px-4 py-4 md:hidden">
          <NavLink to="/services" onClick={() => setOpen(false)}>
            Browse services
          </NavLink>
          {user ? null : (
            <Link to="/register?role=provider" onClick={() => setOpen(false)}>
              Offer a service
            </Link>
          )}
          {user ? <AccountMenu /> : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                Sign up
              </Link>
            </>
          )}
      </AnimatedShow>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-forest">Skill Connect</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Browse services, compare provider details, and send a booking request.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <Link to="/services" className="mt-2 block text-muted">
            Browse services
          </Link>
          <a href="/#how-it-works" className="mt-2 block text-muted">
            How it works
          </a>
          <Link to="/privacy-policy" className="mt-2 block text-muted">
            Privacy policy
          </Link>
          <Link to="/terms-and-conditions" className="mt-2 block text-muted">
            Terms and conditions
          </Link>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Providers</p>
          <Link to="/register?role=provider" className="mt-2 block text-muted">
            Offer a service
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
