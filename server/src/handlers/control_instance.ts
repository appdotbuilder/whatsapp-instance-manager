
import { db } from '../db';
import { whatsappInstancesTable } from '../db/schema';
import { type InstanceControlInput, type WhatsAppInstance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function controlInstance(input: InstanceControlInput, userId: number): Promise<WhatsAppInstance> {
  try {
    // First, verify the instance exists and belongs to the user
    const existingInstances = await db.select()
      .from(whatsappInstancesTable)
      .where(and(
        eq(whatsappInstancesTable.id, input.instance_id),
        eq(whatsappInstancesTable.user_id, userId)
      ))
      .execute();

    if (existingInstances.length === 0) {
      throw new Error('Instance not found or access denied');
    }

    const existingInstance = existingInstances[0];

    // Determine the new status based on the action
    let newStatus: 'starting' | 'stopped' | 'creating';
    switch (input.action) {
      case 'start':
        if (existingInstance.status === 'running') {
          throw new Error('Instance is already running');
        }
        newStatus = 'starting';
        break;
      case 'stop':
        if (existingInstance.status === 'stopped') {
          throw new Error('Instance is already stopped');
        }
        newStatus = 'stopped';
        break;
      case 'restart':
        newStatus = 'starting';
        break;
      default:
        throw new Error('Invalid action');
    }

    // Update the instance status and updated_at timestamp
    const updatedInstances = await db.update(whatsappInstancesTable)
      .set({
        status: newStatus,
        updated_at: new Date()
      })
      .where(eq(whatsappInstancesTable.id, input.instance_id))
      .returning()
      .execute();

    const updatedInstance = updatedInstances[0];

    // Convert the database result to match the schema type
    return {
      ...updatedInstance,
      webhook_events: updatedInstance.webhook_events as string[] | null
    };
  } catch (error) {
    console.error('Instance control failed:', error);
    throw error;
  }
}
