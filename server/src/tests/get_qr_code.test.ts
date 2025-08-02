
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable } from '../db/schema';
import { getQRCode } from '../handlers/get_qr_code';

describe('getQRCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve QR code for valid instance', async () => {
    // Create test user
    const userResults = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResults[0].id;

    // Create test instance with QR code
    const instanceResults = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'creating',
        qr_code: 'base64_qr_code_data',
        api_key: 'test_api_key'
      })
      .returning()
      .execute();
    const instanceId = instanceResults[0].id;

    const result = await getQRCode(instanceId, userId);

    expect(result.qr_code).toEqual('base64_qr_code_data');
  });

  it('should return null QR code when not set', async () => {
    // Create test user
    const userResults = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResults[0].id;

    // Create test instance without QR code
    const instanceResults = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'creating',
        qr_code: null,
        api_key: 'test_api_key'
      })
      .returning()
      .execute();
    const instanceId = instanceResults[0].id;

    const result = await getQRCode(instanceId, userId);

    expect(result.qr_code).toBeNull();
  });

  it('should throw error for non-existent instance', async () => {
    // Create test user
    const userResults = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResults[0].id;

    const invalidInstanceId = 999;

    await expect(getQRCode(invalidInstanceId, userId))
      .rejects.toThrow(/Instance not found or access denied/i);
  });

  it('should throw error when user does not own instance', async () => {
    // Create first user and their instance
    const user1Results = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user1Id = user1Results[0].id;

    const instanceResults = await db.insert(whatsappInstancesTable)
      .values({
        user_id: user1Id,
        instance_name: 'User1 Instance',
        status: 'creating',
        qr_code: 'secret_qr_code',
        api_key: 'test_api_key'
      })
      .returning()
      .execute();
    const instanceId = instanceResults[0].id;

    // Create second user who tries to access the instance
    const user2Results = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user2Id = user2Results[0].id;

    await expect(getQRCode(instanceId, user2Id))
      .rejects.toThrow(/Instance not found or access denied/i);
  });

  it('should retrieve different QR codes for different instances', async () => {
    // Create test user
    const userResults = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResults[0].id;

    // Create first instance
    const instance1Results = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Instance 1',
        status: 'creating',
        qr_code: 'qr_code_1',
        api_key: 'api_key_1'
      })
      .returning()
      .execute();
    const instance1Id = instance1Results[0].id;

    // Create second instance
    const instance2Results = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Instance 2',
        status: 'creating',
        qr_code: 'qr_code_2',
        api_key: 'api_key_2'
      })
      .returning()
      .execute();
    const instance2Id = instance2Results[0].id;

    const result1 = await getQRCode(instance1Id, userId);
    const result2 = await getQRCode(instance2Id, userId);

    expect(result1.qr_code).toEqual('qr_code_1');
    expect(result2.qr_code).toEqual('qr_code_2');
    expect(result1.qr_code).not.toEqual(result2.qr_code);
  });
});
