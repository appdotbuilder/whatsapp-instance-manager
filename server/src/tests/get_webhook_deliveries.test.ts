
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable, webhookDeliveriesTable } from '../db/schema';
import { getWebhookDeliveries } from '../handlers/get_webhook_deliveries';

describe('getWebhookDeliveries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return webhook deliveries for valid instance', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create first webhook delivery
    await db.insert(webhookDeliveriesTable)
      .values({
        instance_id: instanceId,
        event_type: 'message.received',
        payload: { message: 'Hello' },
        webhook_url: 'https://example.com/webhook',
        status: 'delivered',
        response_status: 200,
        retry_count: 0
      })
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second webhook delivery
    await db.insert(webhookDeliveriesTable)
      .values({
        instance_id: instanceId,
        event_type: 'message.sent',
        payload: { message: 'World' },
        webhook_url: 'https://example.com/webhook',
        status: 'failed',
        response_status: 500,
        retry_count: 2
      })
      .execute();

    const result = await getWebhookDeliveries(instanceId, userId);

    expect(result).toHaveLength(2);
    expect(result[0].event_type).toEqual('message.sent'); // Most recent first due to desc order
    expect(result[0].status).toEqual('failed');
    expect(result[0].response_status).toEqual(500);
    expect(result[0].retry_count).toEqual(2);
    expect(result[0].payload).toEqual({ message: 'World' });
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].event_type).toEqual('message.received');
    expect(result[1].status).toEqual('delivered');
    expect(result[1].response_status).toEqual(200);
    expect(result[1].retry_count).toEqual(0);
  });

  it('should return empty array for non-existent instance', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await getWebhookDeliveries(999, userId);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when instance belongs to different user', async () => {
    // Create first user and instance
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: user1Id,
        instance_name: 'User1 Instance',
        status: 'running',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create webhook delivery for user1's instance
    await db.insert(webhookDeliveriesTable)
      .values({
        instance_id: instanceId,
        event_type: 'message.received',
        payload: { message: 'Hello' },
        webhook_url: 'https://example.com/webhook',
        status: 'delivered',
        retry_count: 0
      })
      .execute();

    // Try to access with user2 - should return empty
    const result = await getWebhookDeliveries(instanceId, user2Id);

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create 5 webhook deliveries
    const deliveries = Array.from({ length: 5 }, (_, i) => ({
      instance_id: instanceId,
      event_type: `event.${i}`,
      payload: { index: i },
      webhook_url: 'https://example.com/webhook',
      status: 'delivered' as const,
      retry_count: 0
    }));

    await db.insert(webhookDeliveriesTable)
      .values(deliveries)
      .execute();

    // Test limit of 3
    const result = await getWebhookDeliveries(instanceId, userId, 3);

    expect(result).toHaveLength(3);
  });

  it('should return deliveries ordered by created_at desc', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test instance
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'running',
        api_key: 'test-api-key'
      })
      .returning()
      .execute();
    const instanceId = instanceResult[0].id;

    // Create first webhook delivery
    await db.insert(webhookDeliveriesTable)
      .values({
        instance_id: instanceId,
        event_type: 'first',
        payload: { order: 1 },
        webhook_url: 'https://example.com/webhook',
        status: 'delivered',
        retry_count: 0
      })
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second webhook delivery
    await db.insert(webhookDeliveriesTable)
      .values({
        instance_id: instanceId,
        event_type: 'second',
        payload: { order: 2 },
        webhook_url: 'https://example.com/webhook',
        status: 'delivered',
        retry_count: 0
      })
      .execute();

    const result = await getWebhookDeliveries(instanceId, userId);

    expect(result).toHaveLength(2);
    // Most recent should be first (second event type)
    expect(result[0].event_type).toEqual('second');
    expect(result[1].event_type).toEqual('first');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});
