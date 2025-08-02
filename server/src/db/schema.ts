
import { serial, text, pgTable, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const instanceStatusEnum = pgEnum('instance_status', ['creating', 'stopped', 'starting', 'running', 'error']);
export const logLevelEnum = pgEnum('log_level', ['info', 'warn', 'error', 'debug']);
export const webhookStatusEnum = pgEnum('webhook_status', ['pending', 'delivered', 'failed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// WhatsApp instances table
export const whatsappInstancesTable = pgTable('whatsapp_instances', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  instance_name: text('instance_name').notNull(),
  status: instanceStatusEnum('status').notNull().default('creating'),
  qr_code: text('qr_code'),
  phone_number: text('phone_number'),
  webhook_url: text('webhook_url'),
  webhook_events: jsonb('webhook_events'),
  api_key: text('api_key').notNull(),
  container_id: text('container_id'),
  last_seen: timestamp('last_seen'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Instance logs table
export const instanceLogsTable = pgTable('instance_logs', {
  id: serial('id').primaryKey(),
  instance_id: integer('instance_id').notNull().references(() => whatsappInstancesTable.id, { onDelete: 'cascade' }),
  level: logLevelEnum('level').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Webhook deliveries table
export const webhookDeliveriesTable = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  instance_id: integer('instance_id').notNull().references(() => whatsappInstancesTable.id, { onDelete: 'cascade' }),
  event_type: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  webhook_url: text('webhook_url').notNull(),
  status: webhookStatusEnum('status').notNull().default('pending'),
  response_status: integer('response_status'),
  response_body: text('response_body'),
  retry_count: integer('retry_count').notNull().default(0),
  next_retry_at: timestamp('next_retry_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  whatsappInstances: many(whatsappInstancesTable)
}));

export const whatsappInstancesRelations = relations(whatsappInstancesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [whatsappInstancesTable.user_id],
    references: [usersTable.id]
  }),
  logs: many(instanceLogsTable),
  webhookDeliveries: many(webhookDeliveriesTable)
}));

export const instanceLogsRelations = relations(instanceLogsTable, ({ one }) => ({
  instance: one(whatsappInstancesTable, {
    fields: [instanceLogsTable.instance_id],
    references: [whatsappInstancesTable.id]
  })
}));

export const webhookDeliveriesRelations = relations(webhookDeliveriesTable, ({ one }) => ({
  instance: one(whatsappInstancesTable, {
    fields: [webhookDeliveriesTable.instance_id],
    references: [whatsappInstancesTable.id]
  })
}));

// TypeScript types
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type WhatsAppInstance = typeof whatsappInstancesTable.$inferSelect;
export type NewWhatsAppInstance = typeof whatsappInstancesTable.$inferInsert;
export type InstanceLog = typeof instanceLogsTable.$inferSelect;
export type NewInstanceLog = typeof instanceLogsTable.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveriesTable.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveriesTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  whatsappInstances: whatsappInstancesTable,
  instanceLogs: instanceLogsTable,
  webhookDeliveries: webhookDeliveriesTable
};
