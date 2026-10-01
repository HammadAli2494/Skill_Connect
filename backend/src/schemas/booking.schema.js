import { z } from 'zod';
import { objectId } from './auth.schema.js';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');

export const createBookingSchema = z.object({
  serviceId: objectId,
  scheduledDate: dateString,
  scheduledTime: timeString,
  customerAddress: z.object({
    line1: z.string().trim().min(4).max(160),
    area: z.string().trim().max(80).optional().default(''),
    city: z.string().trim().min(2).max(60),
  }),
  customerNotes: z.string().trim().max(500).optional().default(''),
});

export const bookingStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'in_progress', 'completed', 'cancelled']),
  cancelReason: z.string().trim().max(240).optional(),
});

export const listQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(24).optional().default(12),
});

export const reviewSchema = z.object({
  bookingId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(800).optional().default(''),
});

export const reportSchema = z.object({
  targetType: z.enum(['service', 'review', 'provider']),
  targetId: objectId,
  reason: z.string().trim().min(8).max(500),
});

export const reportUpdateSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  adminNote: z.string().trim().max(500).optional().default(''),
});

export const idParamSchema = z.object({
  id: objectId,
});
