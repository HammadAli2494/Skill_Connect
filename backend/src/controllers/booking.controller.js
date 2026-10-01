import { Booking } from '../models/Booking.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import {
  assertFutureSlot,
  assertSlotAvailable,
  assertTransition,
  slotsFromWindows,
  weekdayKey,
} from '../services/bookingRules.js';
import { notify } from '../services/notifications.js';
import { recalculateCompletedJobs } from '../services/ratings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function presentBooking(booking, viewerRole) {
  const customer = booking.customer;
  const provider = booking.provider;
  const service = booking.service;
  const showCustomerPhone = viewerRole === 'provider' || viewerRole === 'admin';
  const showProviderPhone = ['accepted', 'in_progress', 'completed'].includes(booking.status);

  return {
    id: booking._id,
    status: booking.status,
    scheduledDate: booking.scheduledDate,
    scheduledTime: booking.scheduledTime,
    customerAddress: booking.customerAddress,
    customerNotes: booking.customerNotes,
    priceSnapshot: booking.priceSnapshot,
    cancelReason: booking.cancelReason || '',
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    service: service
      ? {
          id: service._id || service,
          title: service.title || '',
          city: service.city || '',
          images: Array.isArray(service.images) ? service.images.map((image) => image.url || image) : [],
        }
      : null,
    customer: customer
      ? {
          id: customer._id || customer,
          name: customer.name || '',
          phone: showCustomerPhone ? customer.phone || '' : '',
        }
      : null,
    provider: provider
      ? {
          id: provider._id || provider,
          name: provider.name || '',
          phone: showProviderPhone ? provider.phone || '' : '',
        }
      : null,
  };
}

export const createBooking = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    throw new ApiError(403, 'Only customers can book a service.');
  }

  const service = await Service.findOne({ _id: req.body.serviceId, isActive: true });
  if (!service) throw new ApiError(404, 'Service not found.');
  if (String(service.provider) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot book your own service.');
  }

  const providerUser = await User.findById(service.provider);
  if (!providerUser?.isActive) throw new ApiError(404, 'Service not found.');

  const profile = await ProviderProfile.findOne({ user: service.provider });
  if (!profile) throw new ApiError(404, 'Service not found.');

  assertFutureSlot(req.body.scheduledDate, req.body.scheduledTime);
  const day = weekdayKey(req.body.scheduledDate);
  const openSlots = slotsFromWindows(profile.availability?.[day] || []);
  if (!openSlots.includes(req.body.scheduledTime)) {
    throw new ApiError(400, 'That time is outside the provider availability.');
  }

  await assertSlotAvailable({
    providerId: service.provider,
    date: req.body.scheduledDate,
    time: req.body.scheduledTime,
  });

  const booking = await Booking.create({
    customer: req.user._id,
    provider: service.provider,
    service: service._id,
    scheduledDate: req.body.scheduledDate,
    scheduledTime: req.body.scheduledTime,
    customerAddress: req.body.customerAddress,
    customerNotes: req.body.customerNotes || '',
    priceSnapshot: {
      amount: service.price,
      pricingType: service.pricingType,
      currency: 'PKR',
    },
    status: 'pending',
  });

  await notify({
    user: service.provider,
    type: 'booking_request',
    title: 'New booking request',
    message: `${req.user.name} requested ${service.title} on ${booking.scheduledDate} at ${booking.scheduledTime}.`,
    relatedEntity: { type: 'booking', id: booking._id },
  });

  const populated = await booking.populate([
    { path: 'service', select: 'title city images' },
    { path: 'customer', select: 'name phone' },
    { path: 'provider', select: 'name phone' },
  ]);

  res.status(201).json({ success: true, data: { booking: presentBooking(populated, 'customer') } });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const filter = req.user.role === 'provider' ? { provider: req.user._id } : { customer: req.user._id };
  if (req.user.role === 'admin') {
    throw new ApiError(400, 'Use the admin bookings list.');
  }
  if (status) filter.status = status;

  const [rows, total] = await Promise.all([
    Booking.find(filter)
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('service', 'title city images')
      .populate('customer', 'name phone')
      .populate('provider', 'name phone'),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      bookings: rows.map((row) => presentBooking(row, req.user.role)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('service', 'title city images')
    .populate('customer', 'name phone')
    .populate('provider', 'name phone');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isCustomer = String(booking.customer._id || booking.customer) === String(req.user._id);
  const isProvider = String(booking.provider._id || booking.provider) === String(req.user._id);
  if (!isCustomer && !isProvider && req.user.role !== 'admin') {
    throw new ApiError(404, 'Booking not found.');
  }

  res.json({ success: true, data: { booking: presentBooking(booking, req.user.role) } });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isCustomer = String(booking.customer) === String(req.user._id);
  const isProvider = String(booking.provider) === String(req.user._id);
  if (!isCustomer && !isProvider) throw new ApiError(404, 'Booking not found.');

  const nextStatus = req.body.status;
  if (nextStatus === 'cancelled') {
    if (!isCustomer) throw new ApiError(403, 'Only the customer can cancel this booking.');
    assertTransition('customer', booking.status, 'cancelled');
    booking.cancelReason = req.body.cancelReason || '';
  } else {
    if (!isProvider) throw new ApiError(403, 'Only the provider can update this booking.');
    assertTransition('provider', booking.status, nextStatus);
    if (nextStatus === 'accepted') {
      await assertSlotAvailable({
        providerId: booking.provider,
        date: booking.scheduledDate,
        time: booking.scheduledTime,
        ignoreBookingId: booking._id,
      });
    }
  }

  booking.status = nextStatus;
  await booking.save();

  if (nextStatus === 'completed') {
    await recalculateCompletedJobs(booking.provider);
  }

  const copy = {
    accepted: ['Booking accepted', 'Your booking was accepted.'],
    rejected: ['Booking declined', 'The provider declined this booking.'],
    cancelled: ['Booking cancelled', 'The customer cancelled this booking.'],
    in_progress: ['Job started', 'The provider marked the job as in progress.'],
    completed: ['Job completed', 'The job is complete. You can leave a review.'],
  };
  const [title, message] = copy[nextStatus];
  const recipient = nextStatus === 'cancelled' ? booking.provider : booking.customer;
  await notify({
    user: recipient,
    type: `booking_${nextStatus}`,
    title,
    message,
    relatedEntity: { type: 'booking', id: booking._id },
  });

  const populated = await booking.populate([
    { path: 'service', select: 'title city images' },
    { path: 'customer', select: 'name phone' },
    { path: 'provider', select: 'name phone' },
  ]);
  res.json({ success: true, data: { booking: presentBooking(populated, req.user.role) } });
});

export const getAvailability = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).select('provider isActive');
  if (!service?.isActive) throw new ApiError(404, 'Service not found.');
  const date = String(req.query.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'Provide a date as YYYY-MM-DD.');

  const profile = await ProviderProfile.findOne({ user: service.provider });
  const day = weekdayKey(date);
  const open = slotsFromWindows(profile?.availability?.[day] || []);
  const taken = await Booking.find({
    provider: service.provider,
    scheduledDate: date,
    status: { $in: ['accepted', 'in_progress'] },
  }).select('scheduledTime');
  const blocked = new Set(taken.map((item) => item.scheduledTime));
  const slots = open.filter((slot) => !blocked.has(slot));
  res.json({ success: true, data: { date, slots } });
});
