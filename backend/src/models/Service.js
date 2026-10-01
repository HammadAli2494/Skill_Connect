import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    whatsIncluded: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    pricingType: {
      type: String,
      enum: ['fixed', 'hourly', 'starting_at'],
      required: true,
    },
    images: { type: [imageSchema], default: [] },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

serviceSchema.index({ provider: 1, isActive: 1 });
serviceSchema.index({ category: 1, city: 1, isActive: 1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ title: 'text', description: 'text' });

export const PRICING_TYPES = ['fixed', 'hourly', 'starting_at'];
export const MAX_SERVICE_IMAGES = 5;
export const Service = mongoose.model('Service', serviceSchema);
