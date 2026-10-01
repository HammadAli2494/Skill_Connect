import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ServiceCard } from '../../components/services/ServiceCard';
import { ErrorState, Skeleton } from '../../components/common/Status';
import api, { getErrorMessage } from '../../services/api';
import { usePageMeta } from '../../utils/seo';

const STEPS = [
  ['Search the job', 'Enter the work you need and the city where it should happen.'],
  ['Read the listing', 'Compare the price, what is included, and the provider details. Reviews appear only after a completed booking.'],
  ['Send a request', 'Pick an open time. The provider accepts or rejects the request before any work starts.'],
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState({ q: '', city: '' });
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: 'Find a service provider',
    description: 'Browse services, compare provider details, and send a booking request.',
    path: '/',
  });

  function load() {
    setLoading(true);
    setError('');
    Promise.all([api.get('/categories'), api.get('/services', { params: { sort: 'top', limit: 6 } })])
      .then(([cats, list]) => {
        setCategories(cats.data.data.categories);
        setServices(list.data.data.services);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function search(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.city) params.set('city', query.city);
    navigate(`/services?${params.toString()}`);
  }

  return (
    <div>
      <section className="border-b border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-sm font-semibold tracking-wide text-forest uppercase">Skill Connect</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Find a service provider for the job you need.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            Browse services, compare provider details, and send a booking request.
          </p>
          <form onSubmit={search} className="mt-8 grid gap-2 border border-line bg-paper p-2 sm:grid-cols-[1fr_180px_auto]">
            <label className="sr-only" htmlFor="q">
              What service do you need?
            </label>
            <input
              id="q"
              value={query.q}
              onChange={(e) => setQuery({ ...query, q: e.target.value })}
              placeholder="What service do you need?"
              className="h-11 bg-card px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest"
            />
            <label className="sr-only" htmlFor="city">
              City
            </label>
            <input
              id="city"
              value={query.city}
              onChange={(e) => setQuery({ ...query, city: e.target.value })}
              placeholder="City"
              className="h-11 bg-card px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest"
            />
            <button type="submit" className="h-11 bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-dark">
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <Link to="/services" className="text-forest">Browse services</Link>
            <Link to="/register?role=provider" className="text-ink">Offer a service</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-serif text-2xl">Categories</h2>
        <p className="mt-1 text-sm text-muted">These come from the catalogue. Open one to see matching listings.</p>
        {error ? <div className="mt-4"><ErrorState message={error} onRetry={load} /></div> : null}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            : categories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/services?category=${category.slug}`}
                  className="border border-line bg-card px-3 py-4 hover:border-forest"
                >
                  <p className="text-sm font-semibold">{category.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{category.description}</p>
                </Link>
              ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          {STEPS.map(([title, body], index) => (
            <div key={title}>
              <p className="text-sm font-semibold text-forest">0{index + 1}</p>
              <h2 className="mt-2 font-serif text-xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Services</h2>
            <p className="text-sm text-muted">Published listings. A row marked Demo listing is a sample, not a live offer.</p>
          </div>
          <Link to="/services" className="text-sm font-semibold text-forest">
            Browse services
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : services.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Services will appear here once providers publish them.</p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-col justify-between gap-4 border border-line bg-forest px-6 py-8 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl">Offer a service</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
              Create a provider account, publish a listing, and respond to booking requests.
            </p>
          </div>
          <Link to="/register?role=provider" className="inline-flex h-10 items-center bg-card px-4 text-sm font-semibold text-forest">
            Offer a service
          </Link>
        </div>
      </section>
    </div>
  );
}
