
import { db } from '../db';
import { webhookDeliveriesTable, whatsappInstancesTable } from '../db/schema';
import { type WebhookDelivery } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getWebhookDeliveries(instanceId: number, userId: number, limit: number = 50): Promise<WebhookDelivery[]> {
  try {
    // First verify the instance belongs to the user
    const instanceQuery = await db.select()
      .from(whatsappInstancesTable)
      .where(and(
        eq(whatsappInstancesTable.id, instanceId),
        eq(whatsappInstancesTable.user_id, userId)
      ))
      .execute();

    // If instance doesn't exist or doesn't belong to user, return empty array
    if (instanceQuery.length === 0) {
      return [];
    }

    // Fetch webhook deliveries for the instance
    const results = await db.select()
      .from(webhookDeliveriesTable)
      .where(eq(webhookDeliveriesTable.instance_id, instanceId))
      .orderBy(desc(webhookDeliveriesTable.created_at))
      .limit(limit)
      .execute();

    // Convert the results to match the schema type
    return results.map(delivery => ({
      id: delivery.id,
      instance_id: delivery.instance_id,
      event_type: delivery.event_type,
      payload: delivery.payload as Record<string, any>,
      webhook_url: delivery.webhook_url,
      status: delivery.status,
      response_status: delivery.response_status,
      response_body: delivery.response_body,
      retry_count: delivery.retry_count,
      next_retry_at: delivery.next_retry_at,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch webhook deliveries:', error);
    throw error;
  }
}
