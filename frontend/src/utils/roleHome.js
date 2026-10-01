const ROLE_HOME = {
  customer: '/bookings',
  provider: '/provider',
  admin: '/admin',
};

export function roleHome(role) {
  return ROLE_HOME[role] || '';
}

export function dashboardPath(role, next) {
  const home = roleHome(role);
  if (!home) return '';
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) return home;
  const allowed = {
    customer: ['/bookings', '/account', '/notifications', '/services'],
    provider: ['/provider', '/bookings', '/account', '/notifications'],
    admin: ['/admin', '/notifications'],
  };
  const ok = allowed[role].some((path) => next === path || next.startsWith(`${path}/`));
  return ok ? next : home;
}
