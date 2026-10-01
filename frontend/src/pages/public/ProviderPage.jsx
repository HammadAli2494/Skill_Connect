import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, RatingDisplay, Skeleton } from '../../components/common/Status';
import { ServiceCard } from '../../components/services/ServiceCard';
import { CoverImage } from '../../components/common/CoverImage';
import api, { getErrorMessage } from '../../services/api';
import { usePageMeta } from '../../utils/seo';

export default function ProviderPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: data?.profile?.businessName || 'Provider',
    description: 'Provider profile, services, and reviews on Skill Connect.',
    path: `/providers/${id}`,
  });

  useEffect(() => {
    Promise.all([api.get(`/providers/${id}`), api.get(`/providers/${id}/reviews`)])
      .then(([profileRes, reviewRes]) => {
        setData(profileRes.data.data);
        setReviews(reviewRes.data.data.reviews);
      })
      .catch((err) => setError(getErrorMessage(err, 'Provider not found.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8"><Skeleton className="h-48" /></div>;
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={error} /></div>;

  const profile = data.profile;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 border border-line bg-card p-5 sm:flex-row">
        <div className="relative h-20 w-20 shrink-0">
          <CoverImage src={profile.profileImage} alt="" />
        </div>
        <div>
          <h1 className="font-serif text-3xl">{profile.businessName}</h1>
          <p className="text-sm text-muted">{profile.city} · {profile.experienceYears} years experience</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <RatingDisplay rating={profile.averageRating} count={profile.reviewCount} />
            <span>{profile.completedJobs} completed jobs</span>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="font-serif text-xl">About</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{profile.bio || 'This provider has not added a bio yet.'}</p>
          <h2 className="mt-6 font-serif text-xl">Services</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {data.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={{
                  ...service,
                  provider: {
                    id: profile.id,
                    businessName: profile.businessName,
                    averageRating: profile.averageRating,
                    reviewCount: profile.reviewCount,
                  },
                }}
              />
            ))}
          </div>
          <h2 className="mt-8 font-serif text-xl">Reviews</h2>
          <div className="mt-3 space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="border border-line bg-card p-3 text-sm">
                <p className="font-semibold">{review.customerName} · {review.rating}/5</p>
                <p className="text-muted">{review.serviceTitle}</p>
                <p className="mt-1">{review.comment}</p>
              </article>
            ))}
            {!reviews.length ? <p className="text-sm text-muted">No reviews yet.</p> : null}
          </div>
        </div>
        <aside className="text-sm">
          <h2 className="font-semibold">Skills</h2>
          <ul className="mt-2 space-y-1 text-muted">
            {profile.skills?.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
          <h2 className="mt-5 font-semibold">Service area</h2>
          <p className="mt-2 text-muted">{profile.serviceArea?.join(', ') || profile.city}</p>
          <Link to="/services" className="mt-5 inline-block font-semibold text-forest">Back to services</Link>
        </aside>
      </div>
    </div>
  );
}
