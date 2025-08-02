
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

const testLoginInput: LoginInput = {
  email: testUser.email,
  password: testUser.password
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create a test user first
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify response structure
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
    
    expect(result.user).toBeDefined();
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.id).toBeDefined();
    expect(typeof result.user.id).toBe('number');
  });

  it('should reject login with invalid email', async () => {
    // Create a test user
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: testUser.password
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login with invalid password', async () => {
    // Create a test user
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const invalidInput: LoginInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should return correct user data for authenticated user', async () => {
    // Create test user
    const passwordHash = await Bun.password.hash(testUser.password);
    const insertResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const result = await loginUser(testLoginInput);

    // Verify user data matches database record
    expect(result.user.id).toEqual(createdUser.id);
    expect(result.user.email).toEqual(createdUser.email);
    
    // Verify user exists in database
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(dbUsers).toHaveLength(1);
    expect(dbUsers[0].email).toEqual(testUser.email);
  });

  it('should generate different tokens for different login sessions', async () => {
    // Create test user
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const result1 = await loginUser(testLoginInput);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await loginUser(testLoginInput);

    // Tokens should be different due to different timestamps
    expect(result1.token).not.toEqual(result2.token);
    expect(result1.user.email).toEqual(result2.user.email);
    expect(result1.user.id).toEqual(result2.user.id);
  });
});
