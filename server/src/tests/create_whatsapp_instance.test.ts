
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable } from '../db/schema';
import { type CreateInstanceInput } from '../schema';
import { createWhatsAppInstance } from '../handlers/create_whatsapp_instance';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateInstanceInput = {
  instance_name: 'My WhatsApp Bot'
};

describe('createWhatsAppInstance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a WhatsApp instance', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await createWhatsAppInstance(testInput, userId);

    // Basic field validation
    expect(result.instance_name).toEqual('My WhatsApp Bot');
    expect(result.user_id).toEqual(userId);
    expect(result.status).toEqual('creating');
    expect(result.api_key).toBeDefined();
    expect(result.api_key.length).toBeGreaterThan(0);
    expect(result.qr_code).toBeNull();
    expect(result.phone_number).toBeNull();
    expect(result.webhook_url).toBeNull();
    expect(result.webhook_events).toBeNull();
    expect(result.container_id).toBeNull();
    expect(result.last_seen).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save WhatsApp instance to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await createWhatsAppInstance(testInput, userId);

    // Query database to verify instance was saved
    const instances = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.id, result.id))
      .execute();

    expect(instances).toHaveLength(1);
    expect(instances[0].instance_name).toEqual('My WhatsApp Bot');
    expect(instances[0].user_id).toEqual(userId);
    expect(instances[0].status).toEqual('creating');
    expect(instances[0].api_key).toEqual(result.api_key);
    expect(instances[0].created_at).toBeInstanceOf(Date);
    expect(instances[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique API keys', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two instances
    const result1 = await createWhatsAppInstance({ instance_name: 'Bot 1' }, userId);
    const result2 = await createWhatsAppInstance({ instance_name: 'Bot 2' }, userId);

    // API keys should be different
    expect(result1.api_key).not.toEqual(result2.api_key);
    expect(result1.api_key.length).toBeGreaterThan(0);
    expect(result2.api_key.length).toBeGreaterThan(0);
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 99999;

    await expect(createWhatsAppInstance(testInput, nonExistentUserId))
      .rejects.toThrow(/user not found/i);
  });

  it('should create multiple instances for the same user', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple instances
    const result1 = await createWhatsAppInstance({ instance_name: 'Bot 1' }, userId);
    const result2 = await createWhatsAppInstance({ instance_name: 'Bot 2' }, userId);

    // Both should be created successfully
    expect(result1.user_id).toEqual(userId);
    expect(result2.user_id).toEqual(userId);
    expect(result1.instance_name).toEqual('Bot 1');
    expect(result2.instance_name).toEqual('Bot 2');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const instances = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.user_id, userId))
      .execute();

    expect(instances).toHaveLength(2);
  });
});
