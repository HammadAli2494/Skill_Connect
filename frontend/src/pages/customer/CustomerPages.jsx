import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button, Field, Input, PasswordInput, Textarea } from '../../components/common/Fields';
import { DashboardLayout, PageTitle } from '../../components/layout/DashboardLayout';
import { EmptyState, ErrorState, RoleBadge, StatusBadge } from '../../components/common/Status';
import { useAuth } from '../../context/AuthContext';
import api, { getErrorMessage } from '../../services/api';
import { formatDate, formatMoney } from '../../utils/format';
import { roleHome } from '../../utils/roleHome';

export const customerLinks = [
  { to: '/services', label: 'Browse Services' },
  { to: '/bookings', label: 'My Bookings', end: true },
  { to: '/account', label: 'Manage Profile' },
];

export function CustomerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load(nextStatus = status) {
    setLoading(true);
    api
      .get('/bookings/me', { params: nextStatus ? { status: nextStatus } : {} })
      .then((res) => setBookings(res.data.data.bookings))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load('');
  }, []);

  return (
    <DashboardLayout title="Customer dashboard" links={customerLinks}>
      <div className="mb-6 border border-forest/30 bg-moss p-4 sm:p-5">
        <RoleBadge role="customer" />
        <h1 className="mt-3 font-serif text-3xl text-ink">Customer dashboard</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          This is a customer account. Browse services, send a booking, and follow it here. Listing services is only available on a provider account.
        </p>
        <Link to="/services" className="mt-4 inline-flex h-10 items-center bg-forest px-4 text-sm font-semibold text-white">
          Browse services
        </Link>
      </div>
      <h2 className="mb-3 font-semibold">My bookings</h2>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {['', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map((item) => (
          <button
            key={item || 'all'}
            type="button"
            onClick={() => {
              setStatus(item);
              load(item);
            }}
            className={`border px-2 py-1 text-xs font-semibold ${status === item ? 'border-forest bg-forest text-white' : 'border-line bg-card'}`}
          >
            {item || 'All'}
          </button>
        ))}
      </div>
      {error ? <ErrorState message={error} onRetry={() => load(status)} /> : null}
      <div>
      {!loading && !bookings.length ? (
        <EmptyState title="No bookings yet" body="When you send a booking request, it will show up here." action={<Link to="/services" className="text-sm font-semibold text-forest">Browse services</Link>} />
      ) : (
        <div className="overflow-x-auto border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-semibold">Service</th>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Price</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-3">
                    <Link to={`/bookings/${booking.id}`} className="font-semibold text-forest">
                      {booking.service?.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{formatDate(booking.scheduledDate)} · {booking.scheduledTime}</td>
                  <td className="px-3 py-3">{formatMoney(booking.priceSnapshot?.amount)}</td>
                  <td className="px-3 py-3"><StatusBadge status={booking.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}

export function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function load() {
    api.get(`/bookings/${id}`).then((res) => setBooking(res.data.data.booking)).catch((err) => setError(getErrorMessage(err)));
  }
  useEffect(load, [id]);

  async function setStatus(status, extra = {}) {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.patch(`/bookings/${id}/status`, { status, ...extra });
      setBooking(res.data.data.booking);
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function review(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    try {
      await api.post('/reviews', {
        bookingId: id,
        rating: Number(data.get('rating')),
        comment: data.get('comment'),
      });
      setMessage('Review saved.');
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (error) return <DashboardLayout title="Booking" links={user?.role === 'provider' ? providerLinks : customerLinks}><ErrorState message={error} /></DashboardLayout>;
  if (!booking) return <DashboardLayout title="Booking" links={customerLinks}><p className="text-sm text-muted">Loading booking…</p></DashboardLayout>;

  const isCustomer = user?.role === 'customer';
  const isProvider = user?.role === 'provider';

  return (
    <DashboardLayout title="Booking" links={isProvider ? providerLinks : customerLinks}>
      <PageTitle title={booking.service?.title || 'Booking'} action={<StatusBadge status={booking.status} />} />
      <div className="grid gap-4 border border-line bg-card p-4 text-sm md:grid-cols-2">
        <p>Date: {formatDate(booking.scheduledDate)} at {booking.scheduledTime}</p>
        <p>Price snapshot: {formatMoney(booking.priceSnapshot?.amount)} ({booking.priceSnapshot?.pricingType})</p>
        <p>Address: {booking.customerAddress?.line1}, {booking.customerAddress?.area} {booking.customerAddress?.city}</p>
        <p>Notes: {booking.customerNotes || 'None'}</p>
        {isProvider ? <p>Customer: {booking.customer?.name} {booking.customer?.phone}</p> : null}
        {isCustomer && booking.provider?.phone ? <p>Provider phone: {booking.provider.phone}</p> : null}
      </div>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {isCustomer && ['pending', 'accepted'].includes(booking.status) ? (
          <Button variant="danger" loading={loading} onClick={() => setStatus('cancelled', { cancelReason: 'Cancelled by customer' })}>
            Cancel booking
          </Button>
        ) : null}
        {isProvider && booking.status === 'pending' ? (
          <>
            <Button loading={loading} onClick={() => setStatus('accepted')}>Accept</Button>
            <Button variant="secondary" loading={loading} onClick={() => setStatus('rejected')}>Reject</Button>
          </>
        ) : null}
        {isProvider && booking.status === 'accepted' ? <Button loading={loading} onClick={() => setStatus('in_progress')}>Start job</Button> : null}
        {isProvider && booking.status === 'in_progress' ? <Button loading={loading} onClick={() => setStatus('completed')}>Mark completed</Button> : null}
      </div>
      {isCustomer && booking.status === 'completed' ? (
        <form onSubmit={review} className="mt-6 max-w-md space-y-3 border border-line bg-card p-4">
          <h2 className="font-serif text-xl">Leave a review</h2>
          <Field label="Rating">
            <select name="rating" required className="h-11 w-full rounded-md border border-line px-3 text-sm">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Comment"><Textarea name="comment" rows={3} /></Field>
          <Button type="submit" loading={loading}>Submit review</Button>
        </form>
      ) : null}
    </DashboardLayout>
  );
}

export const providerLinks = [
  { to: '/provider', label: 'Provider dashboard', end: true },
  { to: '/provider/services', label: 'My Services', end: true },
  { to: '/provider/services/new', label: 'Add Service' },
  { to: '/provider/bookings', label: 'Booking Requests' },
  { to: '/provider/profile', label: 'Manage Profile' },
];

export function AccountPage() {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      const res = await api.patch('/auth/me', { name: data.get('name'), phone: data.get('phone') });
      setUser(res.data.data.user);
      setMessage('Profile updated.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      await api.patch('/auth/change-password', {
        currentPassword: data.get('currentPassword'),
        newPassword: data.get('newPassword'),
      });
      setMessage('Password changed.');
      event.currentTarget.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      const res = await api.post('/auth/resend-verification');
      setMessage(res.data.data.emailNotice || 'If your email is not verified yet, a new link was sent.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <DashboardLayout title="Manage Profile" links={user?.role === 'provider' ? providerLinks : customerLinks}>
      <PageTitle title="Manage Profile" />
      <div className="mb-4">
        <RoleBadge role={user?.role} />
      </div>
      {!user?.isEmailVerified ? (
        <p className="mb-4 text-sm">
          Email not verified. <button type="button" className="font-semibold text-forest" onClick={resend}>Resend link</button>
        </p>
      ) : null}
      <form onSubmit={saveProfile} className="max-w-md space-y-3 border border-line bg-card p-4">
        <Field label="Name"><Input name="name" defaultValue={user?.name} required /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={user?.phone} /></Field>
        <Button type="submit" loading={loading}>Save profile</Button>
      </form>
      <form onSubmit={savePassword} className="mt-4 max-w-md space-y-3 border border-line bg-card p-4">
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password"><PasswordInput name="currentPassword" required /></Field>
        <Field label="New password"><PasswordInput name="newPassword" required /></Field>
        <Button type="submit" variant="secondary" loading={loading}>Update password</Button>
      </form>
      {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </DashboardLayout>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.get('/notifications').then((res) => setItems(res.data.data.notifications)).catch((err) => setError(getErrorMessage(err)));
  }
  useEffect(load, []);

  async function readOne(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }
  async function readAll() {
    await api.patch('/notifications/read-all');
    load();
  }

  const nav = user?.role === 'admin' ? adminLinks : user?.role === 'provider' ? providerLinks : customerLinks;

  return (
    <DashboardLayout title="Notifications" links={nav}>
      <PageTitle title="Notifications" action={<Button variant="secondary" onClick={readAll}>Mark all read</Button>} />
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!items.length ? <EmptyState title="No notifications" body="Booking updates will appear here." /> : (
        <ul className="divide-y divide-line border border-line bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-muted">{item.message}</p>
              </div>
              {item.isRead ? <span className="text-xs text-muted">Read</span> : (
                <button type="button" className="text-xs font-semibold text-forest" onClick={() => readOne(item.id)}>Mark read</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}

export const adminLinks = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/providers', label: 'Providers' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/reports', label: 'Reports' },
];

export function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6 text-sm text-muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) return <Navigate to={roleHome(user.role) || '/'} replace />;
  return children;
}
