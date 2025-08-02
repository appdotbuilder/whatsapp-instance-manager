
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable } from '../db/schema';
import { type InstanceControlInput } from '../schema';
import { controlInstance } from '../handlers/control_instance';
import { eq } from 'drizzle-orm';

describe('controlInstance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testInstanceId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashedpassword123'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashedpassword456'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test instance
    const instances = await db.insert(whatsappInstancesTable)
      .values({
        user_id: testUserId,
        instance_name: 'Test Instance',
        status: 'stopped',
        api_key: 'test-api-key-123'
      })
      .returning()
      .execute();

    testInstanceId = instances[0].id;
  });

  it('should start a stopped instance', async () => {
    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'start'
    };

    const result = await controlInstance(input, testUserId);

    expect(result.id).toEqual(testInstanceId);
    expect(result.status).toEqual('starting');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify database was updated
    const instances = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.id, testInstanceId))
      .execute();

    expect(instances[0].status).toEqual('starting');
  });

  it('should stop a running instance', async () => {
    // First set instance to running status
    await db.update(whatsappInstancesTable)
      .set({ status: 'running' })
      .where(eq(whatsappInstancesTable.id, testInstanceId))
      .execute();

    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'stop'
    };

    const result = await controlInstance(input, testUserId);

    expect(result.id).toEqual(testInstanceId);
    expect(result.status).toEqual('stopped');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify database was updated
    const instances = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.id, testInstanceId))
      .execute();

    expect(instances[0].status).toEqual('stopped');
  });

  it('should restart an instance regardless of current status', async () => {
    // Test restarting a running instance
    await db.update(whatsappInstancesTable)
      .set({ status: 'running' })
      .where(eq(whatsappInstancesTable.id, testInstanceId))
      .execute();

    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'restart'
    };

    const result = await controlInstance(input, testUserId);

    expect(result.id).toEqual(testInstanceId);
    expect(result.status).toEqual('starting');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when trying to start already running instance', async () => {
    // Set instance to running status
    await db.update(whatsappInstancesTable)
      .set({ status: 'running' })
      .where(eq(whatsappInstancesTable.id, testInstanceId))
      .execute();

    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'start'
    };

    expect(controlInstance(input, testUserId)).rejects.toThrow(/already running/i);
  });

  it('should throw error when trying to stop already stopped instance', async () => {
    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'stop'
    };

    expect(controlInstance(input, testUserId)).rejects.toThrow(/already stopped/i);
  });

  it('should throw error when instance not found', async () => {
    const input: InstanceControlInput = {
      instance_id: 99999,
      action: 'start'
    };

    expect(controlInstance(input, testUserId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user tries to control another users instance', async () => {
    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'start'
    };

    expect(controlInstance(input, otherUserId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should preserve other instance fields when updating status', async () => {
    // Set some additional fields
    await db.update(whatsappInstancesTable)
      .set({
        qr_code: 'test-qr-code',
        phone_number: '+1234567890',
        webhook_url: 'https://example.com/webhook'
      })
      .where(eq(whatsappInstancesTable.id, testInstanceId))
      .execute();

    const input: InstanceControlInput = {
      instance_id: testInstanceId,
      action: 'start'
    };

    const result = await controlInstance(input, testUserId);

    expect(result.qr_code).toEqual('test-qr-code');
    expect(result.phone_number).toEqual('+1234567890');
    expect(result.webhook_url).toEqual('https://example.com/webhook');
    expect(result.instance_name).toEqual('Test Instance');
    expect(result.api_key).toEqual('test-api-key-123');
  });
});
