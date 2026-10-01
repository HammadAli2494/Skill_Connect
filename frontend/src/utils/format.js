export function formatMoney(amount) {
  return `Rs. ${new Intl.NumberFormat('en-PK').format(Number(amount) || 0)}`;
}

export function formatPrice(amount, pricingType) {
  const money = formatMoney(amount);
  if (pricingType === 'hourly') return `${money} / hour`;
  if (pricingType === 'starting_at') return `Starting from ${money}`;
  return money;
}

export function priceLabel(pricingType) {
  if (pricingType === 'hourly') return 'Hourly rate';
  if (pricingType === 'starting_at') return 'Starting from';
  return 'Fixed price';
}

export const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return new Date(value).toLocaleDateString();
  return new Date(year, month - 1, day).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
