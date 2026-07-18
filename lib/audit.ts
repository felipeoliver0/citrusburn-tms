import prisma from './prisma';

/**
 * Logs an action performed by a user to the AuditLog.
 * @param userId - ID of the user performing the action
 * @param action - The action string (e.g., 'LOAD_CREATED', 'ONBOARDING_COMPLETED')
 * @param resourceType - Type of resource modified (e.g., 'Load', 'User', 'LoadRequest')
 * @param resourceId - ID of the resource
 * @param details - Optional JSON object with extra details (e.g., changes made)
 */
export async function logAudit(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details: details || {},
      },
    });
  } catch (error) {
    // Audit log failure shouldn't crash the main transaction, but should be noted
    console.error(`[AUDIT ERROR] Failed to log action ${action} by user ${userId}:`, error);
  }
}
