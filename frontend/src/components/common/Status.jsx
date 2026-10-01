import { motion } from 'framer-motion';
import { easeOut } from '../../utils/motion';
import { STATUS_LABELS } from '../../utils/format';

const TONES = {
  pending: 'bg-amber-50 text-amber-900 border-amber-200',
  accepted: 'bg-moss text-forest border-forest/20',
  in_progress: 'bg-stone-100 text-ink border-line',
  completed: 'bg-moss text-forest border-forest/20',
  cancelled: 'bg-stone-100 text-muted border-line',
  rejected: 'bg-red-50 text-danger border-red-200',
};

const ROLE_BADGES = {
  customer: {
    label: 'Customer account',
    className: 'border-forest bg-moss text-forest',
  },
  provider: {
    label: 'Provider account',
    className: 'border-clay bg-clay-soft text-clay',
  },
  admin: {
    label: 'Admin account',
    className: 'border-ink bg-paper text-ink',
  },
};

export function RoleBadge({ role }) {
  const badge = ROLE_BADGES[role] || { label: 'Account', className: 'border-line bg-paper text-ink' };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${TONES[status] || TONES.pending}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function RatingDisplay({ rating = 0, count = 0 }) {
  const value = Number(rating) || 0;
  if (!count) {
    return <p className="text-sm text-muted">No reviews yet</p>;
  }
  return (
    <p className="text-sm text-ink">
      <svg viewBox="0 0 16 16" className="mr-1 inline h-3.5 w-3.5 fill-star" aria-hidden="true">
        <path d="M8 1.4 9.9 5.7l4.7.5-3.5 3.2.9 4.6L8 11.7 3.9 14l1-4.6L1.4 6.2l4.7-.5L8 1.4z" />
      </svg>
      <span className="font-semibold">{value.toFixed(1)}</span>
      <span className="text-muted"> ({count})</span>
    </p>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="border border-dashed border-line bg-card px-6 py-10 text-center">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="border border-red-200 bg-red-50 px-6 py-8 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold text-forest">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-stone-200/80 ${className}`} />;
}

export function Modal({ title, children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg bg-card shadow-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: easeOut }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-serif text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-muted">
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <button
        type="button"
        className="font-semibold text-forest disabled:text-muted"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="font-semibold text-forest disabled:text-muted"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
