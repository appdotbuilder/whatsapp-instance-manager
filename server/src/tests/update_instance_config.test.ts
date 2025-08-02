
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable } from '../db/schema';
import { type UpdateInstanceInput } from '../schema';
import { updateInstanceConfig } from '../handlers/update_instance_config';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

const otherUser = {
  email: 'other@example.com',
  password_hash: 'other_password'
};

const testInstance = {
  instance_name: 'Test Instance',
  status: 'running' as const,
  api_key: 'test_api_key',
  webhook_url: null,
  webhook_events: null
};

describe('updateInstanceConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update webhook configuration for user instance', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test instance
    const [instance] = await db.insert(whatsappInstancesTable)
      .values({
        ...testInstance,
        user_id: user.id
      })
      .returning()
      .execute();

    const updateInput: UpdateInstanceInput = {
      instance_id: instance.id,
      webhook_url: 'https://example.com/webhook',
      webhook_events: ['message', 'status']
    };

    const result = await updateInstanceConfig(updateInput, user.id);

    expect(result.id).toEqual(instance.id);
    expect(result.webhook_url).toEqual('https://example.com/webhook');
    expect(result.webhook_events).toEqual(['message', 'status']);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > instance.updated_at).toBe(true);
  });

  it('should save webhook configuration to database', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test instance
    const [instance] = await db.insert(whatsappInstancesTable)
      .values({
        ...testInstance,
        user_id: user.id
      })
      .returning()
      .execute();

    const updateInput: UpdateInstanceInput = {
      instance_id: instance.id,
      webhook_url: 'https://api.example.com/hooks',
      webhook_events: ['message_received', 'message_sent', 'connection_status']
    };

    await updateInstanceConfig(updateInput, user.id);

    // Verify database was updated
    const updatedInstance = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.id, instance.id))
      .execute();

    expect(updatedInstance).toHaveLength(1);
    expect(updatedInstance[0].webhook_url).toEqual('https://api.example.com/hooks');
    expect(updatedInstance[0].webhook_events).toEqual(['message_received', 'message_sent', 'connection_status']);
    expect(updatedInstance[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update with null values to clear webhook config', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create instance with existing webhook config
    const [instance] = await db.insert(whatsappInstancesTable)
      .values({
        ...testInstance,
        user_id: user.id,
        webhook_url: 'https://old.example.com/webhook',
        webhook_events: ['old_event']
      })
      .returning()
      .execute();

    const updateInput: UpdateInstanceInput = {
      instance_id: instance.id,
      webhook_url: null,
      webhook_events: null
    };

    const result = await updateInstanceConfig(updateInput, user.id);

    expect(result.webhook_url).toBeNull();
    expect(result.webhook_events).toBeNull();
  });

  it('should throw error when instance not found', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const updateInput: UpdateInstanceInput = {
      instance_id: 999999, // Non-existent instance ID
      webhook_url: 'https://example.com/webhook'
    };

    await expect(updateInstanceConfig(updateInput, user.id))
      .rejects.toThrow(/instance not found or access denied/i);
  });

  it('should throw error when user does not own instance', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values(otherUser)
      .returning()
      .execute();

    // Create instance owned by user1
    const [instance] = await db.insert(whatsappInstancesTable)
      .values({
        ...testInstance,
        user_id: user1.id
      })
      .returning()
      .execute();

    const updateInput: UpdateInstanceInput = {
      instance_id: instance.id,
      webhook_url: 'https://malicious.com/webhook'
    };

    // Try to update as user2 (should fail)
    await expect(updateInstanceConfig(updateInput, user2.id))
      .rejects.toThrow(/instance not found or access denied/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create instance with existing config
    const [instance] = await db.insert(whatsappInstancesTable)
      .values({
        ...testInstance,
        user_id: user.id,
        webhook_url: 'https://existing.com/webhook',
        webhook_events: ['existing_event']
      })
      .returning()
      .execute();

    // Update only webhook_url
    const updateInput: UpdateInstanceInput = {
      instance_id: instance.id,
      webhook_url: 'https://new.com/webhook'
      // webhook_events not provided - should remain unchanged
    };

    const result = await updateInstanceConfig(updateInput, user.id);

    expect(result.webhook_url).toEqual('https://new.com/webhook');
    expect(result.webhook_events).toEqual(['existing_event']); // Should remain unchanged
  });
});
