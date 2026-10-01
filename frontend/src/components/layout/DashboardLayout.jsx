import { NavLink } from 'react-router-dom';
import { AccountMenu } from '../common/AccountMenu';
import { useAuth } from '../../context/AuthContext';

export function DashboardLayout({ title, links, children }) {
  const { user } = useAuth();
  const provider = user?.role === 'provider';
  const activeClass = provider ? 'bg-clay text-white' : 'bg-forest text-white';
  const frame = provider ? 'border-t-4 border-clay' : 'border-t-4 border-forest';

  return (
    <div className={`min-h-screen bg-paper ${frame}`}>
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <NavLink to="/" className={`font-serif text-lg ${provider ? 'text-clay' : 'text-forest'}`}>
            Skill Connect
          </NavLink>
          <div className="flex items-center gap-3">
            {title ? <p className="hidden text-sm text-muted sm:block">{title}</p> : null}
            <AccountMenu />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {links.map((link) => (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? activeClass : 'text-ink hover:bg-card'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}

export function PageTitle({ title, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-serif text-2xl text-ink">{title}</h1>
      {action}
    </div>
  );
}
