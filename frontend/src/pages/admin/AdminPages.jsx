import { useEffect, useState } from 'react';
import { Button, Field, Input, Textarea } from '../../components/common/Fields';
import { DashboardLayout, PageTitle } from '../../components/layout/DashboardLayout';
import { EmptyState, ErrorState, StatusBadge } from '../../components/common/Status';
import api, { getErrorMessage } from '../../services/api';
import { adminLinks } from '../customer/CustomerPages';

function Shell({ title, children }) {
  return (
    <DashboardLayout title="Admin dashboard" links={adminLinks}>
      <PageTitle title={title} />
      {children}
    </DashboardLayout>
  );
}

export function AdminHomePage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data.data)).catch((err) => setError(getErrorMessage(err)));
  }, []);
  return (
    <Shell title="Admin dashboard">
      {error ? <ErrorState message={error} /> : null}
      {stats ? (
        <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
          {[
            ['Users', stats.totalUsers],
            ['Providers', stats.totalProviders],
            ['Services', stats.totalServices],
            ['Bookings', stats.totalBookings],
            ['Completed', stats.completedBookings],
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-3 py-3">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Shell>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  function load() {
    api.get('/admin/users').then((res) => setUsers(res.data.data.users)).catch((err) => setError(getErrorMessage(err)));
  }
  useEffect(load, []);
  async function toggle(user) {
    await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
    load();
  }
  return (
    <Shell title="Users">
      {error ? <ErrorState message={error} /> : null}
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-line text-xs text-muted"><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-line">
              <td className="py-2">{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Disabled'}</td>
              <td>{user.role !== 'admin' ? <button type="button" className="font-semibold text-forest" onClick={() => toggle(user)}>{user.isActive ? 'Disable' : 'Enable'}</button> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}

export function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    api.get('/admin/providers').then((res) => setProviders(res.data.data.providers));
  }, []);
  return (
    <Shell title="Providers">
      {!providers.length ? <EmptyState title="No providers" /> : (
        <ul className="divide-y divide-line border border-line bg-card text-sm">
          {providers.map((provider) => (
            <li key={provider.id} className="px-4 py-3">
              <p className="font-semibold">{provider.businessName}</p>
              <p className="text-muted">{provider.city} · {provider.user?.email} · {provider.user?.isActive ? 'Active' : 'Disabled'}</p>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  function load() {
    api.get('/categories/admin').then((res) => setCategories(res.data.data.categories)).catch((err) => setError(getErrorMessage(err)));
  }
  useEffect(load, []);
  async function create(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api.post('/categories', { name: data.get('name'), description: data.get('description'), icon: data.get('icon') || 'repair' });
      event.currentTarget.reset();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  async function toggle(category) {
    await api.patch(`/categories/${category._id}`, { isActive: !category.isActive });
    load();
  }
  return (
    <Shell title="Categories">
      <form onSubmit={create} className="mb-4 grid gap-2 border border-line bg-card p-4 sm:grid-cols-4">
        <Field label="Name"><Input name="name" required /></Field>
        <Field label="Description"><Input name="description" /></Field>
        <Field label="Icon key"><Input name="icon" placeholder="electrical" /></Field>
        <div className="flex items-end"><Button type="submit">Add</Button></div>
      </form>
      {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
      <ul className="divide-y divide-line border border-line bg-card text-sm">
        {categories.map((category) => (
          <li key={category._id} className="flex items-center justify-between px-4 py-3">
            <span>{category.name} · {category.isActive ? 'Active' : 'Hidden'}</span>
            <button type="button" className="font-semibold text-forest" onClick={() => toggle(category)}>{category.isActive ? 'Hide' : 'Show'}</button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function AdminServicesPage() {
  const [services, setServices] = useState([]);
  function load() {
    api.get('/admin/services').then((res) => setServices(res.data.data.services));
  }
  useEffect(load, []);
  async function toggle(service) {
    await api.patch(`/admin/services/${service.id}/status`, { isActive: !service.isActive });
    load();
  }
  return (
    <Shell title="Listings">
      <ul className="divide-y divide-line border border-line bg-card text-sm">
        {services.map((service) => (
          <li key={service.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span>{service.title}<br /><span className="text-muted">{service.providerName} · {service.city}</span></span>
            <button type="button" className="font-semibold text-forest" onClick={() => toggle(service)}>{service.isActive ? 'Deactivate' : 'Activate'}</button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    api.get('/admin/bookings').then((res) => setBookings(res.data.data.bookings));
  }, []);
  return (
    <Shell title="Bookings">
      <ul className="divide-y divide-line border border-line bg-card text-sm">
        {bookings.map((booking) => (
          <li key={booking.id} className="flex items-center justify-between px-4 py-3">
            <span>{booking.service}<br /><span className="text-muted">{booking.customer} → {booking.provider}</span></span>
            <StatusBadge status={booking.status} />
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [note, setNote] = useState('');
  function load() {
    api.get('/admin/reports').then((res) => setReports(res.data.data.reports));
  }
  useEffect(load, []);
  async function update(id, status) {
    await api.patch(`/admin/reports/${id}`, { status, adminNote: note });
    load();
  }
  return (
    <Shell title="Reports">
      <Field label="Admin note applied to the next action"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></Field>
      {!reports.length ? <EmptyState title="No reports" /> : reports.map((report) => (
        <article key={report._id} className="mt-3 border border-line bg-card p-3 text-sm">
          <p className="font-semibold">{report.targetType} · {report.status}</p>
          <p className="text-muted">{report.reason}</p>
          <p className="text-muted">From {report.reporter?.name}</p>
          {report.status === 'open' ? (
            <div className="mt-2 flex gap-2">
              <Button onClick={() => update(report._id, 'resolved')}>Resolve</Button>
              <Button variant="secondary" onClick={() => update(report._id, 'dismissed')}>Dismiss</Button>
            </div>
          ) : null}
        </article>
      ))}
    </Shell>
  );
}
