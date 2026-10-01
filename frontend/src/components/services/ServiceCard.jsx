import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';
import { CoverImage } from '../common/CoverImage';
import { RatingDisplay } from '../common/Status';

export function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.id}`}
      className="group flex h-full flex-col overflow-hidden border border-line bg-card hover:border-forest"
    >
      <div className="relative aspect-[16/10] bg-stone-200">
        <CoverImage src={service.images?.[0]} alt={service.title} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
          {service.category?.name}
          {service.isDemo ? ' · Demo listing' : ''}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-forest">
          {service.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{service.provider?.businessName}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <RatingDisplay rating={service.provider?.averageRating} count={service.provider?.reviewCount} />
          <span className="text-sm text-muted">{service.city}</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-ink">{formatPrice(service.price, service.pricingType)}</p>
      </div>
    </Link>
  );
}
