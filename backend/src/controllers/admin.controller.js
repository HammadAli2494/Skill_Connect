import { Booking } from '../models/Booking.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function pageParams(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
  return { page, limit };
}

export const stats = asyncHandler(async (req, res) => {
  const [users, providers, services, bookings, completed] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'provider' }),
    Service.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
  ]);
  res.json({
    success: true,
    data: {
      totalUsers: users,
      totalProviders: providers,
      totalServices: services,
      totalBookings: bookings,
      completedBookings: completed,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = pageParams(req.query);
  const filter = {};
  if (req.query.role && ['customer', 'provider', 'admin'].includes(req.query.role)) {
    filter.role = req.query.role;
  }
  if (req.query.q) {
    const term = String(req.query.q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      users: users.map((user) => user.toPublic()),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(403, 'Admin accounts cannot be disabled here.');
  if (String(user._id) === String(req.user._id)) throw new ApiError(400, 'You cannot disable your own account.');
  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, data: { user: user.toPublic() } });
});

export const listProviders = asyncHandler(async (req, res) => {
  const { page, limit } = pageParams(req.query);
  const [profiles, total] = await Promise.all([
    ProviderProfile.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email isActive role'),
    ProviderProfile.countDocuments(),
  ]);
  res.json({
    success: true,
    data: {
      providers: profiles.map((profile) => ({
        id: profile._id,
        businessName: profile.businessName,
        city: profile.city,
        averageRating: profile.averageRating,
        reviewCount: profile.reviewCount,
        completedJobs: profile.completedJobs,
        user: profile.user
          ? {
              id: profile.user._id,
              name: profile.user.name,
              email: profile.user.email,
              isActive: profile.user.isActive,
            }
          : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const listAdminServices = asyncHandler(async (req, res) => {
  const { page, limit } = pageParams(req.query);
  const filter = {};
  if (req.query.isActive === 'true') filter.isActive = true;
  if (req.query.isActive === 'false') filter.isActive = false;
  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name')
      .populate('provider', 'name email'),
    Service.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      services: services.map((service) => ({
        id: service._id,
        title: service.title,
        city: service.city,
        price: service.price,
        pricingType: service.pricingType,
        isActive: service.isActive,
        category: service.category?.name || '',
        providerName: service.provider?.name || '',
        providerEmail: service.provider?.email || '',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const setServiceActive = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found.');
  service.isActive = Boolean(req.body.isActive);
  await service.save();
  res.json({ success: true, data: { id: service._id, isActive: service.isActive } });
});

export const listAdminBookings = asyncHandler(async (req, res) => {
  const { page, limit } = pageParams(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('service', 'title')
      .populate('customer', 'name email')
      .populate('provider', 'name email'),
    Booking.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      bookings: bookings.map((booking) => ({
        id: booking._id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        price: booking.priceSnapshot?.amount,
        service: booking.service?.title || '',
        customer: booking.customer?.name || '',
        provider: booking.provider?.name || '',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const providerDashboard = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  const [activeServices, pendingRequests, activeJobs, recentRequests, upcoming, reviews] = await Promise.all([
    Service.countDocuments({ provider: req.user._id, isActive: true }),
    Booking.countDocuments({ provider: req.user._id, status: 'pending' }),
    Booking.countDocuments({ provider: req.user._id, status: { $in: ['accepted', 'in_progress'] } }),
    Booking.find({ provider: req.user._id, status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('service', 'title')
      .populate('customer', 'name'),
    Booking.find({
      provider: req.user._id,
      status: { $in: ['accepted', 'in_progress'] },
    })
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(5)
      .populate('service', 'title')
      .populate('customer', 'name'),
    (await import('../models/Review.js')).Review.find({ provider: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('service', 'title'),
  ]);

  res.json({
    success: true,
    data: {
      activeServices,
      pendingRequests,
      activeJobs,
      completedJobs: profile?.completedJobs || 0,
      averageRating: profile?.averageRating || 0,
      reviewCount: profile?.reviewCount || 0,
      recentRequests: recentRequests.map(compactBooking),
      upcomingJobs: upcoming.map(compactBooking),
      recentReviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        customerName: review.customer?.name || 'Customer',
        serviceTitle: review.service?.title || '',
        createdAt: review.createdAt,
      })),
    },
  });
});

function compactBooking(booking) {
  return {
    id: booking._id,
    status: booking.status,
    scheduledDate: booking.scheduledDate,
    scheduledTime: booking.scheduledTime,
    serviceTitle: booking.service?.title || '',
    customerName: booking.customer?.name || '',
  };
}
