
import { db } from '../db';
import { whatsappInstancesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function sendMessage(input: SendMessageInput, userId: number): Promise<{ success: boolean; message_id?: string }> {
  try {
    // Verify the instance exists and belongs to the user
    const instances = await db.select()
      .from(whatsappInstancesTable)
      .where(
        and(
          eq(whatsappInstancesTable.id, input.instance_id),
          eq(whatsappInstancesTable.user_id, userId)
        )
      )
      .execute();

    if (instances.length === 0) {
      throw new Error('WhatsApp instance not found or access denied');
    }

    const instance = instances[0];

    // Check if instance is running
    if (instance.status !== 'running') {
      throw new Error(`Cannot send message: instance is ${instance.status}`);
    }

    // Check if instance has a phone number (is connected)
    if (!instance.phone_number) {
      throw new Error('WhatsApp instance is not connected');
    }

    // Update last_seen timestamp
    await db.update(whatsappInstancesTable)
      .set({ 
        last_seen: new Date(),
        updated_at: new Date()
      })
      .where(eq(whatsappInstancesTable.id, input.instance_id))
      .execute();

    // In a real implementation, this would make an API call to the WhatsApp service
    // For now, we simulate success and generate a mock message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      message_id: messageId
    };
  } catch (error) {
    console.error('Send message failed:', error);
    throw error;
  }
}
