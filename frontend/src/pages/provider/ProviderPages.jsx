import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CoverImage } from '../../components/common/CoverImage';
import { Button, Field, Input, Textarea } from '../../components/common/Fields';
import { DashboardLayout, PageTitle } from '../../components/layout/DashboardLayout';
import { EmptyState, ErrorState, RoleBadge, StatusBadge } from '../../components/common/Status';
import api, { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';
import { providerLinks } from '../customer/CustomerPages';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ProviderDashboardPage() {
  const [data, setData] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/provider-dashboard'), api.get('/services/mine')])
      .then(([dash, mine]) => {
        setData(dash.data.data);
        setServices(mine.data.data.services || []);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <DashboardLayout title="Provider dashboard" links={providerLinks}>
      <div className="mb-6 border border-clay/40 bg-clay-soft p-4 sm:p-5">
        <RoleBadge role="provider" />
        <h1 className="mt-3 font-serif text-3xl text-ink">Provider dashboard</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          This is a provider account. Add the services you offer and respond to booking requests. Booking a service yourself requires a customer account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/provider/services/new" className="inline-flex h-10 items-center bg-clay px-4 text-sm font-semibold text-white">Add Service</Link>
          <Link to="/provider/bookings" className="inline-flex h-10 items-center border border-clay px-4 text-sm font-semibold text-clay">Booking Requests</Link>
          <Link to="/provider/profile" className="inline-flex h-10 items-center border border-line bg-card px-4 text-sm font-semibold text-ink">Manage Profile</Link>
        </div>
      </div>
      {error ? <ErrorState message={error} /> : null}
      <h2 className="mb-3 font-semibold">My services</h2>
      {!services.length ? (
        <EmptyState title="No services yet" body="Add the work you want customers to book." action={<Link to="/provider/services/new" className="text-sm font-semibold text-clay">Add Service</Link>} />
      ) : (
        <ul className="divide-y divide-line border border-line bg-card">
          {services.map((service) => (
            <li key={service.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <div className="relative h-14 w-20 shrink-0">
                <CoverImage src={service.images?.[0]} alt={service.title} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{service.title}</p>
                <p className="text-muted">{service.city} · {service.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <Link to={`/provider/services/${service.id}/edit`} className="font-semibold text-clay">Edit</Link>
            </li>
          ))}
        </ul>
      )}
      {data ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {[
              ['Active services', data.activeServices],
              ['Pending requests', data.pendingRequests],
              ['Active jobs', data.activeJobs],
              ['Completed jobs', data.completedJobs],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-3 py-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <List title="Booking requests" rows={data.recentRequests} empty="No booking requests yet. When a customer books one of your services, it will show up here." />
            <List title="Upcoming jobs" rows={data.upcomingJobs} empty="No upcoming jobs." />
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}

function List({ title, rows, empty }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {rows?.length ? rows.map((row) => (
        <Link key={row.id} to={`/bookings/${row.id}`} className="flex items-center justify-between border-b border-line py-2 text-sm">
          <span>{row.serviceTitle}<br /><span className="text-muted">{row.customerName} · {formatDate(row.scheduledDate)} {row.scheduledTime}</span></span>
          <StatusBadge status={row.status} />
        </Link>
      )) : <p className="text-sm text-muted">{empty}</p>}
    </div>
  );
}

export function ProviderServicesPage() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.get('/services/mine').then((res) => setServices(res.data.data.services)).catch((err) => setError(getErrorMessage(err)));
  }
  useEffect(load, []);

  async function deactivate(id) {
    await api.delete(`/services/${id}`);
    load();
  }

  return (
    <DashboardLayout title="My Services" links={providerLinks}>
      <PageTitle title="My Services" action={<Link to="/provider/services/new" className="inline-flex h-10 items-center bg-clay px-4 text-sm font-semibold text-white">Add Service</Link>} />
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!services.length ? <EmptyState title="No services yet" body="Add the work you want customers to book." action={<Link to="/provider/services/new" className="text-sm font-semibold text-clay">Add Service</Link>} /> : (
        <ul className="divide-y divide-line border border-line bg-card">
          {services.map((service) => (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-20 shrink-0">
                  <CoverImage src={service.images?.[0]} alt={service.title} />
                </div>
                <div>
                  <p className="font-semibold">{service.title}</p>
                  <p className="text-muted">{service.city} · {service.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to={`/provider/services/${service.id}/edit`} className="font-semibold text-clay">Edit</Link>
                {service.isActive ? <button type="button" className="text-danger" onClick={() => deactivate(service.id)}>Deactivate</button> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}

export function ServiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data.categories));
    if (id) {
      api.get('/services/mine').then((res) => {
        const found = res.data.data.services.find((item) => item.id === id);
        if (!found) {
          setError('Service not found.');
          return;
        }
        setService(found);
        setImages((found.images || []).map((url) => ({ url })));
      });
    }
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const included = String(data.get('included') || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const body = {
      title: data.get('title'),
      description: data.get('description'),
      category: data.get('category'),
      price: Number(data.get('price')),
      pricingType: data.get('pricingType'),
      city: data.get('city'),
      whatsIncluded: included,
    };
    setLoading(true);
    setError('');
    try {
      if (id) await api.patch(`/services/${id}`, body);
      else {
        const res = await api.post('/services', body);
        navigate(`/provider/services/${res.data.data.service.id}/edit`);
        return;
      }
      navigate('/provider/services');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file || !id) return;
    const data = new FormData();
    data.append('image', file);
    try {
      const res = await api.post(`/services/${id}/images`, data);
      setImages(res.data.data.images);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (id && !service && !error) {
    return (
      <DashboardLayout title="Service" links={providerLinks}>
        <p className="text-sm text-muted">Loading service…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Service" links={providerLinks}>
      <PageTitle title={id ? 'Edit service' : 'Add Service'} />
      <form key={service?.id || 'new'} onSubmit={submit} className="max-w-xl space-y-4">
        <section className="space-y-3 border border-line bg-card p-4">
          <h2 className="font-semibold">Details</h2>
          <Field label="Title"><Input name="title" required defaultValue={service?.title} /></Field>
          <Field label="Description"><Textarea name="description" required minLength={20} rows={4} defaultValue={service?.description} /></Field>
          <Field label="What is included" hint="One item per line">
            <Textarea name="included" rows={3} defaultValue={(service?.whatsIncluded || []).join('\n')} />
          </Field>
        </section>
        <section className="space-y-3 border border-line bg-card p-4">
          <h2 className="font-semibold">Pricing and location</h2>
          <Field label="Category">
            <select name="category" required defaultValue={service?.category?.id || ''} className="h-11 w-full rounded-md border border-line px-3 text-sm">
              <option value="">Choose</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Price (PKR)"><Input name="price" type="number" min="1" required defaultValue={service?.price} /></Field>
          <Field label="Pricing type">
            <select name="pricingType" defaultValue={service?.pricingType || 'starting_at'} className="h-11 w-full rounded-md border border-line px-3 text-sm">
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
              <option value="starting_at">Starting at</option>
            </select>
          </Field>
          <Field label="City"><Input name="city" required defaultValue={service?.city} /></Field>
        </section>
        {id ? (
          <section className="border border-line bg-card p-4">
            <h2 className="font-semibold">Images</h2>
            <p className="mt-1 text-xs text-muted">JPG, PNG, or WEBP. Up to 5 images, 5 MB each. Uploads need Cloudinary on the server. If it is not configured, the form will say so and the listing can still be saved.</p>
            <input className="mt-3 text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />
            <div className="mt-3 flex gap-2">
              {images.map((image) => (
                <CoverImage key={image.url || image.publicId || image} src={image.url || image} alt="Uploaded service photo" className="relative h-16 w-24" />
              ))}
            </div>
          </section>
        ) : <p className="text-sm text-muted">Save the service first, then you can add images.</p>}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" loading={loading}>Save service</Button>
      </form>
    </DashboardLayout>
  );
}

export function ProviderBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/bookings/me').then((res) => setBookings(res.data.data.bookings)).catch((err) => setError(getErrorMessage(err)));
  }, []);
  return (
    <DashboardLayout title="Booking Requests" links={providerLinks}>
      <PageTitle title="Booking Requests" />
      {error ? <ErrorState message={error} /> : null}
      {!bookings.length ? <EmptyState title="No bookings" body="New requests will be listed here." /> : (
        <ul className="divide-y divide-line border border-line bg-card">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link to={`/bookings/${booking.id}`} className="font-semibold text-clay">{booking.service?.title}</Link>
              <span className="text-muted">{formatDate(booking.scheduledDate)} {booking.scheduledTime}</span>
              <StatusBadge status={booking.status} />
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}

export function AvailabilityPage() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    api.get('/providers/me').then((res) => setAvailability(res.data.data.profile.availability)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {};
    for (const day of DAYS) {
      const start = data.get(`${day}-start`);
      const end = data.get(`${day}-end`);
      body[day] = start && end ? [{ start, end }] : [];
    }
    try {
      await api.patch('/providers/me/availability', body);
      setMessage('Availability saved. Customers can book one-hour slots inside these hours.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!availability && !error) {
    return (
      <DashboardLayout title="Availability" links={providerLinks}>
        <p className="text-sm text-muted">Loading hours…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Availability" links={providerLinks}>
      <PageTitle title="Weekly hours" />
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <form onSubmit={save} className="max-w-lg space-y-2 border border-line bg-card p-4">
        {DAYS.map((day) => {
          const window = availability?.[day]?.[0] || { start: '', end: '' };
          return (
            <div key={day} className="grid grid-cols-[110px_1fr_1fr] items-center gap-2 text-sm">
              <span className="capitalize">{day}</span>
              <Input name={`${day}-start`} type="time" defaultValue={window.start} aria-label={`${day} start`} />
              <Input name={`${day}-end`} type="time" defaultValue={window.end} aria-label={`${day} end`} />
            </div>
          );
        })}
        <Button type="submit">Save hours</Button>
        {message ? <p className="text-sm text-forest">{message}</p> : null}
      </form>
    </DashboardLayout>
  );
}

export function ProviderProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api.get('/providers/me').then((res) => setProfile(res.data.data.profile)).catch((err) => {
      if (err.response?.status === 404) setMissing(true);
      else setError(getErrorMessage(err));
    });
  }, []);

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      businessName: data.get('businessName'),
      bio: data.get('bio'),
      experienceYears: Number(data.get('experienceYears') || 0),
      city: data.get('city'),
      skills: String(data.get('skills') || '').split(',').map((s) => s.trim()).filter(Boolean),
      serviceArea: String(data.get('serviceArea') || '').split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = missing ? await api.post('/providers/me', body) : await api.patch('/providers/me', body);
      setProfile(res.data.data.profile);
      setMissing(false);
      setMessage('Profile saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    try {
      await api.post('/providers/me/avatar', data);
      setMessage('Photo updated.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!profile && !missing && !error) {
    return (
      <DashboardLayout title="Profile" links={providerLinks}>
        <p className="text-sm text-muted">Loading profile…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Profile" links={providerLinks}>
      <PageTitle title="Manage Profile" />
      <div className="mb-4"><RoleBadge role="provider" /></div>
      <form key={profile?.id || 'create'} onSubmit={save} className="max-w-xl space-y-3 border border-line bg-card p-4">
        <Field label="Business name"><Input name="businessName" required defaultValue={profile?.businessName} /></Field>
        <Field label="Bio"><Textarea name="bio" rows={4} defaultValue={profile?.bio} /></Field>
        <Field label="Years of experience"><Input name="experienceYears" type="number" min="0" defaultValue={profile?.experienceYears || 0} /></Field>
        <Field label="City"><Input name="city" required defaultValue={profile?.city} /></Field>
        <Field label="Skills" hint="Comma separated"><Input name="skills" defaultValue={(profile?.skills || []).join(', ')} /></Field>
        <Field label="Service areas" hint="Comma separated"><Input name="serviceArea" defaultValue={(profile?.serviceArea || []).join(', ')} /></Field>
        <Field label="Profile photo"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-forest">{message}</p> : null}
        <Button type="submit">{missing ? 'Create profile' : 'Save profile'}</Button>
      </form>
    </DashboardLayout>
  );
}

export function ProviderReviewsPage() {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    api.get('/providers/me').then((res) => {
      const next = res.data.data.profile;
      setProfile(next);
      return api.get(`/providers/${next.id}/reviews`);
    }).then((res) => {
      if (res) setReviews(res.data.data.reviews);
    }).catch(() => {});
  }, []);
  return (
    <DashboardLayout title="Reviews" links={providerLinks}>
      <PageTitle title="Reviews" />
      <p className="mb-3 text-sm text-muted">Average {profile?.averageRating || 0} from {profile?.reviewCount || 0} reviews.</p>
      {!reviews.length ? <EmptyState title="No reviews yet" /> : reviews.map((review) => (
        <article key={review.id} className="border-b border-line py-3 text-sm">
          <p className="font-semibold">{review.rating}/5 · {review.customerName}</p>
          <p>{review.comment}</p>
        </article>
      ))}
    </DashboardLayout>
  );
}
