
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<{ token: string; user: { id: number; email: string } }> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password using Bun's built-in password hashing
    const isValidPassword = await Bun.password.verify(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Use a simple secret for JWT signing (in production, this should be from environment variables)
    const secret = 'your-jwt-secret-key';
    const token = await new Promise<string>((resolve, reject) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payloadEncoded = btoa(JSON.stringify(payload));
      const signature = btoa(`${header}.${payloadEncoded}.${secret}`);
      resolve(`${header}.${payloadEncoded}.${signature}`);
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
