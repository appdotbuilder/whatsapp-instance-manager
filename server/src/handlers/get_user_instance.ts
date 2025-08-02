
import { db } from '../db';
import { whatsappInstancesTable } from '../db/schema';
import { type WhatsAppInstance } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserInstance(userId: number): Promise<WhatsAppInstance | null> {
  try {
    const results = await db.select()
      .from(whatsappInstancesTable)
      .where(eq(whatsappInstancesTable.user_id, userId))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert webhook_events from jsonb to array
    const instance = results[0];
    return {
      ...instance,
      webhook_events: instance.webhook_events as string[] | null
    };
  } catch (error) {
    console.error('Failed to get user instance:', error);
    throw error;
  }
}
