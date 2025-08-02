
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, whatsappInstancesTable } from '../db/schema';
import { getUserInstance } from '../handlers/get_user_instance';

describe('getUserInstance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when user has no instance', async () => {
    // Create user without instance
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const result = await getUserInstance(userId);
    
    expect(result).toBeNull();
  });

  it('should return user instance when it exists', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create instance for user
    const instanceResult = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'creating',
        api_key: 'test-api-key-123',
        webhook_events: ['message', 'status']
      })
      .returning()
      .execute();

    const result = await getUserInstance(userId);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(instanceResult[0].id);
    expect(result?.user_id).toEqual(userId);
    expect(result?.instance_name).toEqual('Test Instance');
    expect(result?.status).toEqual('creating');
    expect(result?.api_key).toEqual('test-api-key-123');
    expect(result?.webhook_events).toEqual(['message', 'status']);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return only one instance when user has multiple instances', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create multiple instances for user
    await db.insert(whatsappInstancesTable)
      .values([
        {
          user_id: userId,
          instance_name: 'First Instance',
          status: 'creating',
          api_key: 'first-api-key'
        },
        {
          user_id: userId,
          instance_name: 'Second Instance',
          status: 'running',
          api_key: 'second-api-key'
        }
      ])
      .execute();

    const result = await getUserInstance(userId);

    expect(result).not.toBeNull();
    expect(result?.instance_name).toEqual('First Instance'); // Should return first one (limit 1)
  });

  it('should handle null webhook_events', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create instance without webhook_events
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: 'Test Instance',
        status: 'stopped',
        api_key: 'test-api-key',
        webhook_events: null
      })
      .execute();

    const result = await getUserInstance(userId);

    expect(result).not.toBeNull();
    expect(result?.webhook_events).toBeNull();
  });

  it('should not return instances for different users', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create instance for user2 only
    await db.insert(whatsappInstancesTable)
      .values({
        user_id: user2Id,
        instance_name: 'User2 Instance',
        status: 'running',
        api_key: 'user2-api-key'
      })
      .execute();

    // Try to get instance for user1
    const result = await getUserInstance(user1Id);

    expect(result).toBeNull();
  });
});
