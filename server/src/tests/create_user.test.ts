
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(testInput);

    // Verify password is hashed using Bun's password verification
    const isValidHash = await Bun.password.verify('password123', result.password_hash);
    expect(isValidHash).toBe(true);

    // Verify original password doesn't match hash
    expect(result.password_hash).not.toEqual('password123');
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    await expect(createUser(testInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should handle different email formats', async () => {
    const emailVariations = [
      'user.name@example.com',
      'user+tag@example.org',
      'user123@sub.domain.com'
    ];

    for (const email of emailVariations) {
      const input: CreateUserInput = {
        email: email,
        password: 'password123'
      };

      const result = await createUser(input);
      expect(result.email).toEqual(email);
      expect(result.id).toBeDefined();
    }
  });
});
