import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { MAX_SERVICE_IMAGES, Service } from '../models/Service.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { User } from '../models/User.js';
import { deleteImage, uploadImage } from '../services/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function presentService(service, profile, category, providerUser) {
  return {
    id: service._id || service.id,
    title: service.title,
    description: service.description,
    whatsIncluded: service.whatsIncluded || [],
    price: service.price,
    pricingType: service.pricingType,
    images: (service.images || [])
      .map((image) => (typeof image === 'string' ? image : image?.url || image?.secure_url || ''))
      .filter(Boolean),
    city: service.city,
    isActive: service.isActive,
    isDemo: Boolean(service.isDemo),
    createdAt: service.createdAt,
    category: category
      ? { id: category._id || category.id, name: category.name, slug: category.slug, icon: category.icon }
      : null,
    provider: profile
      ? {
          id: profile._id || profile.id,
          userId: providerUser?._id || profile.user,
          businessName: profile.businessName,
          city: profile.city,
          averageRating: profile.averageRating || 0,
          reviewCount: profile.reviewCount || 0,
          completedJobs: profile.completedJobs || 0,
          profileImage: profile.profileImage?.url || profile.profileImage || '',
          name: providerUser?.name || '',
        }
      : null,
  };
}

export const listServices = asyncHandler(async (req, res) => {
  const { q, category, city, minPrice, maxPrice, minRating, sort, page, limit } = req.query;
  const match = { isActive: true };

  if (q) match.title = { $regex: escapeRegex(q), $options: 'i' };
  if (city) match.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };
  if (minPrice !== undefined || maxPrice !== undefined) {
    match.price = {};
    if (minPrice !== undefined) match.price.$gte = minPrice;
    if (maxPrice !== undefined) match.price.$lte = maxPrice;
  }
  if (category) {
    const cat = await Category.findOne({ slug: category, isActive: true }).select('_id');
    if (!cat) {
      res.json({
        success: true,
        data: { services: [], pagination: { page, limit, total: 0, totalPages: 1 } },
      });
      return;
    }
    match.category = cat._id;
  }

  const sortMap = {
    top: { 'profile.averageRating': -1, 'profile.reviewCount': -1, createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
  };

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'provider',
        foreignField: '_id',
        as: 'providerUser',
      },
    },
    { $unwind: '$providerUser' },
    { $match: { 'providerUser.isActive': true } },
    {
      $lookup: {
        from: 'providerprofiles',
        localField: 'provider',
        foreignField: 'user',
        as: 'profile',
      },
    },
    { $unwind: '$profile' },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: '$categoryDoc' },
    { $match: { 'categoryDoc.isActive': true } },
  ];

  if (minRating) pipeline.push({ $match: { 'profile.averageRating': { $gte: minRating } } });

  const countPipeline = [...pipeline, { $count: 'total' }];
  pipeline.push({ $sort: sortMap[sort] || sortMap.top });
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: limit });

  const [rows, countRows] = await Promise.all([
    Service.aggregate(pipeline),
    Service.aggregate(countPipeline),
  ]);
  const total = countRows[0]?.total || 0;

  res.json({
    success: true,
    data: {
      services: rows.map((row) =>
        presentService(row, row.profile, row.categoryDoc, row.providerUser)
      ),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const getService = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Service not found.');
  const service = await Service.findById(req.params.id);
  if (!service || !service.isActive) throw new ApiError(404, 'Service not found.');

  const [profile, category, providerUser] = await Promise.all([
    ProviderProfile.findOne({ user: service.provider }),
    Category.findById(service.category),
    User.findById(service.provider),
  ]);
  if (!providerUser?.isActive || !category?.isActive) throw new ApiError(404, 'Service not found.');

  res.json({
    success: true,
    data: { service: presentService(service, profile, category, providerUser) },
  });
});

async function requireOwnProfile(userId) {
  const profile = await ProviderProfile.findOne({ user: userId });
  if (!profile) throw new ApiError(400, 'Create your provider profile before adding a service.');
  return profile;
}

export const createService = asyncHandler(async (req, res) => {
  await requireOwnProfile(req.user._id);
  const category = await Category.findOne({ _id: req.body.category, isActive: true });
  if (!category) throw new ApiError(400, 'Choose an active category.');

  const service = await Service.create({
    provider: req.user._id,
    category: category._id,
    title: req.body.title,
    description: req.body.description,
    whatsIncluded: req.body.whatsIncluded || [],
    price: req.body.price,
    pricingType: req.body.pricingType,
    city: req.body.city,
    isActive: req.body.isActive !== false,
  });

  const profile = await ProviderProfile.findOne({ user: req.user._id });
  res.status(201).json({
    success: true,
    data: { service: presentService(service, profile, category, req.user) },
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found.');
  if (String(service.provider) !== String(req.user._id)) {
    throw new ApiError(404, 'Service not found.');
  }

  if (req.body.category) {
    const category = await Category.findOne({ _id: req.body.category, isActive: true });
    if (!category) throw new ApiError(400, 'Choose an active category.');
    service.category = category._id;
  }

  const fields = ['title', 'description', 'whatsIncluded', 'price', 'pricingType', 'city', 'isActive'];
  for (const field of fields) {
    if (req.body[field] !== undefined) service[field] = req.body[field];
  }
  await service.save();

  const [profile, category] = await Promise.all([
    ProviderProfile.findOne({ user: req.user._id }),
    Category.findById(service.category),
  ]);
  res.json({ success: true, data: { service: presentService(service, profile, category, req.user) } });
});

export const deactivateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found.');
  if (String(service.provider) !== String(req.user._id)) throw new ApiError(404, 'Service not found.');
  service.isActive = false;
  await service.save();
  res.json({ success: true, data: { id: service._id, isActive: false } });
});

export const myServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ provider: req.user._id }).populate('category', 'name slug icon').sort({ createdAt: -1 });
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  res.json({
    success: true,
    data: {
      services: services.map((service) => presentService(service, profile, service.category, req.user)),
    },
  });
});

export const addServiceImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload.');
  const service = await Service.findById(req.params.id);
  if (!service || String(service.provider) !== String(req.user._id)) {
    throw new ApiError(404, 'Service not found.');
  }
  if (service.images.length >= MAX_SERVICE_IMAGES) {
    throw new ApiError(400, `A service can have up to ${MAX_SERVICE_IMAGES} images.`);
  }
  const image = await uploadImage(req.file.buffer, 'skillconnect/services');
  service.images.push(image);
  await service.save();
  res.status(201).json({
    success: true,
    data: { images: service.images.map((item) => ({ url: item.url, publicId: item.publicId })) },
  });
});

export const removeServiceImage = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service || String(service.provider) !== String(req.user._id)) {
    throw new ApiError(404, 'Service not found.');
  }
  const publicId = decodeURIComponent(req.params.publicId);
  const image = service.images.find((item) => item.publicId === publicId);
  if (!image) throw new ApiError(404, 'Image not found.');
  await deleteImage(image.publicId);
  service.images = service.images.filter((item) => item.publicId !== publicId);
  await service.save();
  res.json({
    success: true,
    data: { images: service.images.map((item) => ({ url: item.url, publicId: item.publicId })) },
  });
});
