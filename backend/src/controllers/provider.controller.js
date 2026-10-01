import { ProviderProfile } from '../models/ProviderProfile.js';
import { Review } from '../models/Review.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { deleteImage, uploadImage } from '../services/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function publicProfile(profile, user) {
  return {
    id: profile._id,
    userId: user._id,
    name: user.name,
    businessName: profile.businessName,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    skills: profile.skills,
    city: profile.city,
    serviceArea: profile.serviceArea,
    availability: profile.availability,
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    completedJobs: profile.completedJobs,
    profileImage: profile.profileImage?.url || user.avatar?.url || '',
  };
}

export const createMyProfile = asyncHandler(async (req, res) => {
  const existing = await ProviderProfile.findOne({ user: req.user._id });
  if (existing) throw new ApiError(409, 'You already have a provider profile.');

  const profile = await ProviderProfile.create({
    user: req.user._id,
    businessName: req.body.businessName,
    bio: req.body.bio,
    experienceYears: req.body.experienceYears,
    skills: req.body.skills,
    city: req.body.city,
    serviceArea: req.body.serviceArea,
  });

  res.status(201).json({ success: true, data: { profile: publicProfile(profile, req.user) } });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Create your provider profile first.');
  res.json({ success: true, data: { profile: publicProfile(profile, req.user) } });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Create your provider profile first.');

  const fields = ['businessName', 'bio', 'experienceYears', 'skills', 'city', 'serviceArea'];
  for (const field of fields) {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  }
  await profile.save();
  res.json({ success: true, data: { profile: publicProfile(profile, req.user) } });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Create your provider profile first.');
  profile.availability = req.body;
  await profile.save();
  res.json({ success: true, data: { availability: profile.availability } });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload.');
  const image = await uploadImage(req.file.buffer, 'skillconnect/avatars');

  if (req.user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (profile?.profileImage?.publicId) await deleteImage(profile.profileImage.publicId);
    if (profile) {
      profile.profileImage = image;
      await profile.save();
    }
  }

  if (req.user.avatar?.publicId) await deleteImage(req.user.avatar.publicId);
  req.user.avatar = image;
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toPublic() } });
});

export const getProvider = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.id);
  if (!profile) throw new ApiError(404, 'Provider not found.');
  const user = await User.findById(profile.user);
  if (!user || !user.isActive) throw new ApiError(404, 'Provider not found.');

  const services = await Service.find({ provider: user._id, isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(24);

  res.json({
    success: true,
    data: {
      profile: publicProfile(profile, user),
      services: services.map(serializeService),
    },
  });
});

export const getProviderReviews = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.id).select('user');
  if (!profile) throw new ApiError(404, 'Provider not found.');

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 24);
  const filter = { provider: profile.user };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'name avatar')
      .populate('service', 'title'),
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
        serviceTitle: review.service?.title || '',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

function serializeService(service) {
  return {
    id: service._id,
    title: service.title,
    price: service.price,
    pricingType: service.pricingType,
    city: service.city,
    images: (service.images || []).map((image) => image.url),
    category: service.category
      ? { id: service.category._id, name: service.category.name, slug: service.category.slug }
      : null,
  };
}
