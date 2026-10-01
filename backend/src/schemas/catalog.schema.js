import { z } from 'zod';
import { objectId } from './auth.schema.js';

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional().default(''),
  icon: z.string().trim().min(2).max(40).optional().default('repair'),
  isActive: z.boolean().optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

export const serviceSchema = z.object({
  category: objectId,
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().min(20).max(2000),
  whatsIncluded: z.array(z.string().trim().min(2).max(120)).max(10).optional().default([]),
  price: z.coerce.number().positive().max(1000000),
  pricingType: z.enum(['fixed', 'hourly', 'starting_at']),
  city: z.string().trim().min(2).max(60),
  isActive: z.boolean().optional(),
});

export const serviceUpdateSchema = serviceSchema.partial();

export const serviceQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(['top', 'price_asc', 'price_desc', 'newest']).optional().default('top'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(24).optional().default(12),
});
