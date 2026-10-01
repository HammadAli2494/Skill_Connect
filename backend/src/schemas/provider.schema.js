import { z } from 'zod';
import { objectId } from './auth.schema.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');

const windowSchema = z
  .object({ start: time, end: time })
  .refine((value) => value.start < value.end, { message: 'End time must be after start time' });

const dayWindows = z.array(windowSchema).max(3);

export const providerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(800).optional().default(''),
  experienceYears: z.coerce.number().int().min(0).max(60).optional().default(0),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  city: z.string().trim().min(2).max(60),
  serviceArea: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([]),
});

export const availabilitySchema = z.object({
  monday: dayWindows.optional().default([]),
  tuesday: dayWindows.optional().default([]),
  wednesday: dayWindows.optional().default([]),
  thursday: dayWindows.optional().default([]),
  friday: dayWindows.optional().default([]),
  saturday: dayWindows.optional().default([]),
  sunday: dayWindows.optional().default([]),
});

export const providerIdParam = z.object({ id: objectId });
