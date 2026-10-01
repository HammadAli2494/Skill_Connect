import { Category } from '../models/Category.js';
import { Service } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: { categories } });
});

export const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: { categories } });
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const exists = await Category.findOne({ slug });
  if (exists) throw new ApiError(409, 'A category with that name already exists.');
  const category = await Category.create({
    name: req.body.name,
    slug,
    description: req.body.description || '',
    icon: req.body.icon || 'repair',
    isActive: req.body.isActive !== false,
  });
  res.status(201).json({ success: true, data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.icon) category.icon = req.body.icon;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;
  await category.save();
  res.json({ success: true, data: { category } });
});

export const listCities = asyncHandler(async (req, res) => {
  const cities = await Service.distinct('city', { isActive: true });
  cities.sort((a, b) => a.localeCompare(b));
  res.json({ success: true, data: { cities } });
});
