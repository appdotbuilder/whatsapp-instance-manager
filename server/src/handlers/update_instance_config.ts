
import { db } from '../db';
import { whatsappInstancesTable } from '../db/schema';
import { type UpdateInstanceInput, type WhatsAppInstance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateInstanceConfig(input: UpdateInstanceInput, userId: number): Promise<WhatsAppInstance> {
  try {
    // Update the instance with webhook configuration, ensuring user ownership
    const result = await db.update(whatsappInstancesTable)
      .set({
        webhook_url: input.webhook_url,
        webhook_events: input.webhook_events,
        updated_at: new Date()
      })
      .where(and(
        eq(whatsappInstancesTable.id, input.instance_id),
        eq(whatsappInstancesTable.user_id, userId)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Instance not found or access denied');
    }

    const instance = result[0];
    return {
      ...instance,
      webhook_events: instance.webhook_events as string[] | null
    };
  } catch (error) {
    console.error('Instance config update failed:', error);
    throw error;
  }
}
