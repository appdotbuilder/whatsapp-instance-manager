
import { db } from '../db';
import { whatsappInstancesTable, usersTable } from '../db/schema';
import { type CreateInstanceInput, type WhatsAppInstance } from '../schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function createWhatsAppInstance(input: CreateInstanceInput, userId: number): Promise<WhatsAppInstance> {
  try {
    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Generate API key
    const apiKey = randomBytes(32).toString('hex');

    // Insert WhatsApp instance record
    const result = await db.insert(whatsappInstancesTable)
      .values({
        user_id: userId,
        instance_name: input.instance_name,
        status: 'creating',
        api_key: apiKey,
        qr_code: null,
        phone_number: null,
        webhook_url: null,
        webhook_events: null,
        container_id: null,
        last_seen: null
      })
      .returning()
      .execute();

    const instance = result[0];

    // Convert webhook_events from unknown to string[] | null for type compatibility
    return {
      ...instance,
      webhook_events: instance.webhook_events as string[] | null
    };
  } catch (error) {
    console.error('WhatsApp instance creation failed:', error);
    throw error;
  }
}
