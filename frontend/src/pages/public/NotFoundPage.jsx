import { Link } from 'react-router-dom';
import { usePageMeta } from '../../utils/seo';

export default function NotFoundPage() {
  usePageMeta({
    title: 'Page not found',
    description: 'That Skill Connect page does not exist.',
    path: '/404',
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-sm font-semibold text-forest">404</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">That page does not exist.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The address may be mistyped, or the page may have been moved. Browse current listings or return to the homepage.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className="inline-flex h-10 items-center bg-forest px-4 text-sm font-semibold text-white">
          Home
        </Link>
        <Link to="/services" className="inline-flex h-10 items-center border border-line bg-card px-4 text-sm font-semibold text-ink">
          Browse services
        </Link>
      </div>
    </div>
  );
}
