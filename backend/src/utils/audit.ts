import { prisma } from '../config/db.js';

/**
 * Persists an enterprise audit log event inside PostgreSQL database
 */
export const logAudit = async (
  userId: string | null,
  username: string,
  action: string,
  category: string,
  details: string,
  ipAddress?: string
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        username,
        action,
        category,
        details,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('Failed to save Audit Log entry:', err);
  }
};
