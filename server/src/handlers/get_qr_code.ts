
import { db } from '../db';
import { whatsappInstancesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function getQRCode(instanceId: number, userId: number): Promise<{ qr_code: string | null }> {
  try {
    // Query for the instance with both instance_id and user_id to ensure ownership
    const results = await db.select({
      qr_code: whatsappInstancesTable.qr_code
    })
    .from(whatsappInstancesTable)
    .where(and(
      eq(whatsappInstancesTable.id, instanceId),
      eq(whatsappInstancesTable.user_id, userId)
    ))
    .execute();

    // If no instance found (either doesn't exist or user doesn't own it)
    if (results.length === 0) {
      throw new Error('Instance not found or access denied');
    }

    return {
      qr_code: results[0].qr_code
    };
  } catch (error) {
    console.error('Failed to retrieve QR code:', error);
    throw error;
  }
}
