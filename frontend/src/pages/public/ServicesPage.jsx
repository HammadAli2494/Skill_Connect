import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input, Select } from '../../components/common/Fields';
import { AnimatedShow } from '../../components/common/Motion';
import { EmptyState, ErrorState, Pagination, Skeleton } from '../../components/common/Status';
import { ServiceCard } from '../../components/services/ServiceCard';
import api, { getErrorMessage } from '../../services/api';
import { usePageMeta } from '../../utils/seo';

const SORTS = [
  ['top', 'Top rated'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['newest', 'Newest'],
];

export default function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  usePageMeta({
    title: 'Browse services',
    description: 'Search service listings by job, city, category, and price, then open a provider to send a booking request.',
    path: '/services',
  });

  const filters = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    city: params.get('city') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    minRating: params.get('minRating') || '',
    sort: params.get('sort') || 'top',
    page: params.get('page') || '1',
  };

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data.categories)).catch(() => {});
    api.get('/categories/cities').then((res) => setCities(res.data.data.cities)).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = Object.fromEntries([...params.entries()].filter(([, value]) => value));
    setLoading(true);
    setError('');
    api
      .get('/services', { params: query, signal: controller.signal })
      .then((res) => {
        setServices(res.data.data.services);
        setPagination(res.data.data.pagination);
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [params]);

  function update(next) {
    const merged = { ...filters, ...next, page: next.page || '1' };
    const clean = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value) clean[key] = value;
    });
    setParams(clean);
    setFiltersOpen(false);
  }

  const filterForm = (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        update({
          q: data.get('q'),
          category: data.get('category'),
          city: data.get('city'),
          minPrice: data.get('minPrice'),
          maxPrice: data.get('maxPrice'),
          minRating: data.get('minRating'),
        });
      }}
    >
      <Input name="q" defaultValue={filters.q} placeholder="Keyword" aria-label="Keyword" />
      <Select name="category" defaultValue={filters.category} aria-label="Category">
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category._id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select name="city" defaultValue={filters.city} aria-label="City">
        <option value="">All cities</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Input name="minPrice" type="number" min="0" defaultValue={filters.minPrice} placeholder="Min price" aria-label="Minimum price" />
        <Input name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice} placeholder="Max price" aria-label="Maximum price" />
      </div>
      <Select name="minRating" defaultValue={filters.minRating} aria-label="Minimum rating">
        <option value="">Any rating</option>
        <option value="4">4 stars and up</option>
        <option value="3">3 stars and up</option>
      </Select>
      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        <Button type="button" variant="secondary" onClick={() => setParams({})}>
          Clear filters
        </Button>
      </div>
    </form>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <h1 className="mb-3 font-serif text-xl">Filters</h1>
        {filterForm}
      </aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl">Services</h1>
            <p className="text-sm text-muted">{loading ? 'Searching…' : `${pagination.total} results`}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              Filters
            </Button>
            <Select
              aria-label="Sort"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value, page: filters.page })}
              className="w-44"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <AnimatedShow show={filtersOpen} className="mb-4 border border-line bg-card p-4 lg:hidden">{filterForm}</AnimatedShow>
        {error ? <ErrorState message={error} onRetry={() => setParams(new URLSearchParams(params))} /> : null}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : services.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No services match these filters."
            body="Try another city, category, or a wider price range."
            action={
              <Button variant="secondary" onClick={() => setParams({})}>
                Clear filters
              </Button>
            }
          />
        )}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPage={(page) => update({ page: String(page) })}
        />
      </div>
    </div>
  );
}
