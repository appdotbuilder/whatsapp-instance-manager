
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable, instanceLogsTable } from '../db/schema';
import { getInstanceLogs } from '../handlers/get_instance_logs';

describe('getInstanceLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch logs for a valid instance', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create test logs
    await db.insert(instanceLogsTable)
      .values([
        {
          instance_id: instanceId,
          level: 'info',
          message: 'Instance started'
        },
        {
          instance_id: instanceId,
          level: 'error',
          message: 'Connection failed'
        },
        {
          instance_id: instanceId,
          level: 'warn',
          message: 'High memory usage'
        }
      ])
      .execute();

    const logs = await getInstanceLogs(instanceId, userId);

    expect(logs).toHaveLength(3);
    expect(logs[0].message).toBeDefined();
    expect(logs[0].level).toBeDefined();
    expect(logs[0].created_at).toBeInstanceOf(Date);
    expect(logs[0].instance_id).toEqual(instanceId);

    // Verify logs are ordered by most recent first (newest to oldest)
    expect(logs[0].created_at >= logs[1].created_at).toBe(true);
    expect(logs[1].created_at >= logs[2].created_at).toBe(true);
  });

  it('should respect the limit parameter', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create 5 test logs
    const logEntries = Array.from({ length: 5 }, (_, i) => ({
      instance_id: instanceId,
      level: 'info' as const,
      message: `Log message ${i + 1}`
    }));

    await db.insert(instanceLogsTable)
      .values(logEntries)
      .execute();

    const logs = await getInstanceLogs(instanceId, userId, 3);

    expect(logs).toHaveLength(3);
  });

  it('should return empty array for instance with no logs', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance (no logs)
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    const logs = await getInstanceLogs(instanceId, userId);

    expect(logs).toHaveLength(0);
  });

  it('should throw error for non-existent instance', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    await expect(getInstanceLogs(999, userId))
      .rejects.toThrow(/instance not found or access denied/i);
  });

  it('should throw error when user tries to access another users instance', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create instance for user1
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: user1Id,
        instance_name: 'User1 Instance',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Try to access user1's instance as user2
    await expect(getInstanceLogs(instanceId, user2Id))
      .rejects.toThrow(/instance not found or access denied/i);
  });

  it('should handle logs with metadata correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create log with metadata
    await db.insert(instanceLogsTable)
      .values({
        instance_id: instanceId,
        level: 'error',
        message: 'API request failed',
        metadata: { statusCode: 500, endpoint: '/api/send-message' }
      })
      .execute();

    const logs = await getInstanceLogs(instanceId, userId);

    expect(logs).toHaveLength(1);
    expect(logs[0].metadata).toEqual({ statusCode: 500, endpoint: '/api/send-message' });
  });
});
