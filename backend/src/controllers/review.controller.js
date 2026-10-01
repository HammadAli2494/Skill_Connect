import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { notify } from '../services/notifications.js';
import { recalculateProviderRating } from '../services/ratings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') throw new ApiError(403, 'Only customers can leave reviews.');

  const booking = await Booking.findById(req.body.bookingId);
  if (!booking || String(booking.customer) !== String(req.user._id)) {
    throw new ApiError(404, 'Booking not found.');
  }
  if (booking.status !== 'completed') {
    throw new ApiError(400, 'You can review a booking only after it is completed.');
  }

  const existing = await Review.findOne({ booking: booking._id }).select('_id');
  if (existing) throw new ApiError(409, 'This booking already has a review.');

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    provider: booking.provider,
    service: booking.service,
    rating: req.body.rating,
    comment: req.body.comment || '',
  });

  const stats = await recalculateProviderRating(booking.provider);
  await notify({
    user: booking.provider,
    type: 'review_received',
    title: 'New review',
    message: `${req.user.name} left a ${review.rating}-star review.`,
    relatedEntity: { type: 'review', id: review._id },
  });

  res.status(201).json({
    success: true,
    data: {
      review: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        bookingId: review.booking,
        createdAt: review.createdAt,
      },
      providerRating: stats,
    },
  });
});

export const serviceReviews = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 24);
  const filter = { service: req.params.id };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'name'),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      reviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customerName: review.customer?.name || 'Customer',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});
