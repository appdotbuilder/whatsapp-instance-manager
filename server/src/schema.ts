
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// WhatsApp instance schema
export const whatsappInstanceSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  instance_name: z.string(),
  status: z.enum(['creating', 'stopped', 'starting', 'running', 'error']),
  qr_code: z.string().nullable(),
  phone_number: z.string().nullable(),
  webhook_url: z.string().url().nullable(),
  webhook_events: z.array(z.string()).nullable(),
  api_key: z.string(),
  container_id: z.string().nullable(),
  last_seen: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WhatsAppInstance = z.infer<typeof whatsappInstanceSchema>;

// Instance logs schema
export const instanceLogSchema = z.object({
  id: z.number(),
  instance_id: z.number(),
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string(),
  metadata: z.record(z.any()).nullable(),
  created_at: z.coerce.date()
});

export type InstanceLog = z.infer<typeof instanceLogSchema>;

// Webhook delivery schema
export const webhookDeliverySchema = z.object({
  id: z.number(),
  instance_id: z.number(),
  event_type: z.string(),
  payload: z.record(z.any()),
  webhook_url: z.string().url(),
  status: z.enum(['pending', 'delivered', 'failed']),
  response_status: z.number().nullable(),
  response_body: z.string().nullable(),
  retry_count: z.number().int(),
  next_retry_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WebhookDelivery = z.infer<typeof webhookDeliverySchema>;

// Input schemas for creating/updating
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const createInstanceInputSchema = z.object({
  instance_name: z.string().min(1).max(50)
});

export type CreateInstanceInput = z.infer<typeof createInstanceInputSchema>;

export const updateInstanceInputSchema = z.object({
  instance_id: z.number(),
  webhook_url: z.string().url().nullable().optional(),
  webhook_events: z.array(z.string()).nullable().optional()
});

export type UpdateInstanceInput = z.infer<typeof updateInstanceInputSchema>;

export const sendMessageInputSchema = z.object({
  instance_id: z.number(),
  to: z.string(),
  message: z.string(),
  type: z.enum(['text', 'image', 'document']).default('text')
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const instanceControlInputSchema = z.object({
  instance_id: z.number(),
  action: z.enum(['start', 'stop', 'restart'])
});

export type InstanceControlInput = z.infer<typeof instanceControlInputSchema>;
