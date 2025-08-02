
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

const testInput: SendMessageInput = {
  instance_id: 1,
  to: '+1234567890',
  message: 'Hello, World!',
  type: 'text'
};

describe('sendMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should send a message successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create running WhatsApp instance
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        phone_number: '+0987654321',
        api_key: 'test_api_key'
      })
      .execute();

    const result = await sendMessage(testInput, userId);

    expect(result.success).toBe(true);
    expect(result.message_id).toBeDefined();
    expect(typeof result.message_id).toBe('string');
    expect(result.message_id).toMatch(/^msg_\d+_[a-z0-9]+$/);
  });

  it('should update last_seen timestamp', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create running WhatsApp instance
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        phone_number: '+0987654321',
        api_key: 'test_api_key'
      })
      .execute();

    const beforeTime = new Date();
    await sendMessage(testInput, userId);

    // Check that last_seen was updated
    const instances = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.id, testInput.instance_id))
      .execute();

    expect(instances).toHaveLength(1);
    expect(instances[0].last_seen).toBeInstanceOf(Date);
    expect(instances[0].last_seen!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
  });

  it('should throw error when instance not found', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    await expect(sendMessage(testInput, userId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user does not own instance', async () => {
    // Create test users
    const userResult1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId1 = userResult1[0].id;

    const userResult2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId2 = userResult2[0].id;

    // Create instance for user1
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId1,
        instance_name: 'User1 Instance',
        status: 'running',
        phone_number: '+0987654321',
        api_key: 'test_api_key'
      })
      .execute();

    // Try to send message as user2
    await expect(sendMessage(testInput, userId2)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when instance is not running', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create stopped instance
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'stopped',
        phone_number: '+0987654321',
        api_key: 'test_api_key'
      })
      .execute();

    await expect(sendMessage(testInput, userId)).rejects.toThrow(/cannot send message.*stopped/i);
  });

  it('should throw error when instance is not connected', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create running instance without phone number
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        phone_number: null,
        api_key: 'test_api_key'
      })
      .execute();

    await expect(sendMessage(testInput, userId)).rejects.toThrow(/not connected/i);
  });

  it('should handle different message types', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create running WhatsApp instance
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        phone_number: '+0987654321',
        api_key: 'test_api_key'
      })
      .execute();

    // Test image message
    const imageInput: SendMessageInput = {
      instance_id: 1,
      to: '+1234567890',
      message: 'Image message',
      type: 'image'
    };

    const result = await sendMessage(imageInput, userId);
    expect(result.success).toBe(true);
    expect(result.message_id).toBeDefined();
  });
});
