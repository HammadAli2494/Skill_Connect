import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    monday: { type: [slotSchema], default: [] },
    tuesday: { type: [slotSchema], default: [] },
    wednesday: { type: [slotSchema], default: [] },
    thursday: { type: [slotSchema], default: [] },
    friday: { type: [slotSchema], default: [] },
    saturday: { type: [slotSchema], default: [] },
    sunday: { type: [slotSchema], default: [] },
  },
  { _id: false }
);

const providerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true, maxlength: 80 },
    bio: { type: String, default: '', maxlength: 800 },
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    skills: { type: [String], default: [] },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    serviceArea: { type: [String], default: [] },
    availability: { type: availabilitySchema, default: () => ({}) },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    completedJobs: { type: Number, default: 0, min: 0 },
    profileImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

providerProfileSchema.index({ city: 1 });
providerProfileSchema.index({ averageRating: -1, reviewCount: -1 });

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);
