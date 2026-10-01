import { Booking } from '../models/Booking.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Review } from '../models/Review.js';

export async function recalculateProviderRating(providerUserId) {
  const [stats] = await Review.aggregate([
    { $match: { provider: providerUserId } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const averageRating = stats ? Math.round(stats.average * 10) / 10 : 0;
  const reviewCount = stats ? stats.count : 0;

  await ProviderProfile.updateOne(
    { user: providerUserId },
    { $set: { averageRating, reviewCount } }
  );

  return { averageRating, reviewCount };
}

export async function recalculateCompletedJobs(providerUserId) {
  const completedJobs = await Booking.countDocuments({
    provider: providerUserId,
    status: 'completed',
  });
  await ProviderProfile.updateOne({ user: providerUserId }, { $set: { completedJobs } });
  return completedJobs;
}
