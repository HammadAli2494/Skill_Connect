import mongoose from 'mongoose';

export const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'in_progress',
  'completed',
  'cancelled',
];

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    customerAddress: {
      line1: { type: String, required: true, trim: true, maxlength: 160 },
      area: { type: String, default: '', trim: true, maxlength: 80 },
      city: { type: String, required: true, trim: true, maxlength: 60 },
    },
    customerNotes: { type: String, default: '', maxlength: 500 },
    priceSnapshot: {
      amount: { type: Number, required: true, min: 0 },
      pricingType: { type: String, required: true },
      currency: { type: String, default: 'PKR' },
    },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    cancelReason: { type: String, default: '', maxlength: 240 },
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, status: 1, scheduledDate: 1 });
bookingSchema.index({ provider: 1, scheduledDate: 1, scheduledTime: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
