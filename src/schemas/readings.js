import { z } from 'zod';

export const LatestReadingSchema = z.object({
  device_id: z.string(),
  location: z.string(),
  raw_value: z.number().int(),
  voltage: z.string(),
  status: z.enum(['fresh', 'moderate', 'critical']),
  updated_at: z.string().datetime(),
  cooldown_until: z.string().datetime().nullable(),
});

export const ReadingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(LatestReadingSchema),
});

export const SnoozeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    device_id: z.string(),
    cooldown_until: z.string().datetime().nullable(),
  }),
});

export const HistoryEntrySchema = z.object({
  id: z.coerce.number().int(),
  device_id: z.string(),
  raw_value: z.number().int(),
  voltage: z.string(),
  status: z.enum(['fresh', 'moderate', 'critical']),
  recorded_at: z.string().datetime(),
});

export const HistoryResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(HistoryEntrySchema),
  meta: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});

export const AlertContactSchema = z.object({
  id: z.coerce.number().int(),
  location: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  created_at: z.string().datetime(),
});

export const ContactsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(AlertContactSchema),
});

export const CreateContactResponseSchema = z.object({
  success: z.literal(true),
  data: AlertContactSchema,
});
