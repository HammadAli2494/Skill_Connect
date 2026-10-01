import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Field, Input, Textarea } from '../../components/common/Fields';
import { ErrorState, RatingDisplay, Skeleton } from '../../components/common/Status';
import { useAuth } from '../../context/AuthContext';
import { CoverImage } from '../../components/common/CoverImage';
import { AnimatedShow } from '../../components/common/Motion';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice, priceLabel } from '../../utils/format';
import { usePageMeta } from '../../utils/seo';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  usePageMeta({
    title: service?.title || 'Service',
    description: service?.description || 'Service listing on Skill Connect.',
    path: `/services/${id}`,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/services/${id}`), api.get(`/reviews/service/${id}`)])
      .then(([serviceRes, reviewRes]) => {
        setService(serviceRes.data.data.service);
        setReviews(reviewRes.data.data.reviews);
      })
      .catch((err) => setError(getErrorMessage(err, 'This service is unavailable.')))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!date) return;
    api
      .get(`/bookings/availability/${id}`, { params: { date } })
      .then((res) => setSlots(res.data.data.slots))
      .catch(() => setSlots([]));
  }, [date, id]);

  async function book(event) {
    event.preventDefault();
    if (!user) {
      navigate(`/login?next=/services/${id}`);
      return;
    }
    if (user.role !== 'customer') {
      setFormError('Bookings are available on customer accounts.');
      return;
    }
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/bookings', {
        serviceId: id,
        scheduledDate: data.get('date'),
        scheduledTime: data.get('time'),
        customerAddress: {
          line1: data.get('line1'),
          area: data.get('area'),
          city: data.get('city') || service.city,
        },
        customerNotes: data.get('notes'),
      });
      navigate(`/bookings/${res.data.data.booking.id}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function report(event) {
    event.preventDefault();
    const reason = new FormData(event.currentTarget).get('reason');
    try {
      await api.post('/reports', { targetType: 'service', targetId: id, reason });
      setReportOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (error || !service) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={error || 'Service not found.'} /></div>;

  const image = service.images?.[imageIndex];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="relative aspect-[16/10] bg-stone-200">
          <div key={imageIndex} className="absolute inset-0">
            <CoverImage src={image} alt={service.title} />
          </div>
        </div>
        {service.images?.length > 1 ? (
          <div className="mt-2 flex gap-2">
            {service.images.map((src, index) => (
              <button
                type="button"
                key={`${src}-${index}`}
                onClick={() => setImageIndex(index)}
                className={`relative h-14 w-20 overflow-hidden border ${index === imageIndex ? 'border-forest' : 'border-line'}`}
              >
                <CoverImage src={src} alt="" />
              </button>
            ))}
          </div>
        ) : null}
        {service.isDemo ? (
          <p className="mt-5 text-sm font-semibold text-forest">Demo listing. This sample is not a live offer.</p>
        ) : null}
        <p className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">{service.category?.name}</p>
        <h1 className="mt-1 font-serif text-3xl">{service.title}</h1>
        <p className="mt-2 text-sm text-muted">{service.city}</p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink">{service.description}</p>
        {service.whatsIncluded?.length ? (
          <div className="mt-6">
            <h2 className="font-semibold">What is included</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {service.whatsIncluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="font-serif text-xl">Provider</h2>
          <Link to={`/providers/${service.provider?.id}`} className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 bg-moss" />
            <div>
              <p className="font-semibold">{service.provider?.businessName}</p>
              <RatingDisplay rating={service.provider?.averageRating} count={service.provider?.reviewCount} />
              <p className="text-sm text-muted">{service.provider?.completedJobs || 0} completed jobs</p>
            </div>
          </Link>
        </div>
        <div className="mt-8">
          <h2 className="font-serif text-xl">Reviews</h2>
          <div className="mt-3 space-y-3">
            {reviews.length ? reviews.map((review) => (
              <article key={review.id} className="border border-line bg-card p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{review.customerName}</span>
                  <span>{review.rating} / 5</span>
                </div>
                <p className="mt-1 text-sm text-muted">{review.comment}</p>
              </article>
            )) : <p className="text-sm text-muted">No reviews yet.</p>}
          </div>
          {user ? (
            <button type="button" className="mt-3 text-sm font-semibold text-forest" onClick={() => setReportOpen((v) => !v)}>
              Report this listing
            </button>
          ) : null}
          <AnimatedShow show={reportOpen} className="mt-3 max-w-md">
            <form onSubmit={report} className="space-y-2">
              <Textarea name="reason" required minLength={8} placeholder="What is wrong with this listing?" />
              <Button type="submit" variant="secondary">Submit report</Button>
            </form>
          </AnimatedShow>
        </div>
      </div>
      <aside className="h-fit border border-line bg-card p-4 shadow-card lg:sticky lg:top-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{priceLabel(service.pricingType)}</p>
        <p className="mt-1 text-2xl font-semibold">{formatPrice(service.price, service.pricingType)}</p>
        <form onSubmit={book} className="mt-4 space-y-3">
          <Field label="Date">
            <Input name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <select name="time" required className="h-11 w-full rounded-md border border-line bg-card px-3 text-sm" defaultValue="">
              <option value="" disabled>
                {date ? (slots.length ? 'Choose a time' : 'No open times') : 'Choose a date first'}
              </option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address">
            <Input name="line1" required placeholder="Street and house number" />
          </Field>
          <Field label="Area">
            <Input name="area" placeholder="Neighbourhood" />
          </Field>
          <Field label="City">
            <Input name="city" required defaultValue={service.city} />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={3} placeholder="Anything the provider should know" />
          </Field>
          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
          <Button type="submit" loading={submitting} className="w-full">
            Send booking request
          </Button>
          <p className="text-xs leading-5 text-muted">
            This sends a request. The provider accepts or rejects it. The price is saved with the request and does not change if the listing price changes later.
          </p>
        </form>
      </aside>
    </div>
  );
}
