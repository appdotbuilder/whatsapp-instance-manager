
import { db } from '../db';
import { instanceLogsTable, whatsappInstancesTable } from '../db/schema';
import { type InstanceLog } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getInstanceLogs(instanceId: number, userId: number, limit: number = 100): Promise<InstanceLog[]> {
  try {
    // First verify that the instance exists and belongs to the user
    const instance = await db.select()
      .from(whatsappInstancesTable)
      .where(and(
        eq(whatsappInstancesTable.id, instanceId),
        eq(whatsappInstancesTable.user_id, userId)
      ))
      .execute();

    if (instance.length === 0) {
      throw new Error('Instance not found or access denied');
    }

    // Fetch logs for the instance, ordered by most recent first
    const results = await db.select()
      .from(instanceLogsTable)
      .where(eq(instanceLogsTable.instance_id, instanceId))
      .orderBy(desc(instanceLogsTable.created_at))
      .limit(limit)
      .execute();

    // Transform the results to match the expected InstanceLog type
    return results.map(log => ({
      id: log.id,
      instance_id: log.instance_id,
      level: log.level,
      message: log.message,
      metadata: log.metadata as Record<string, any> | null,
      created_at: log.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch instance logs:', error);
    throw error;
  }
}
