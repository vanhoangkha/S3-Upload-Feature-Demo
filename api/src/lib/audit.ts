import { AuthContext } from './auth';
import { putAuditRecord, AuditRecord } from './dynamodb';

export interface AuditLogEntry {
  actor: AuthContext;
  action: string;
  resource: {
    type: string;
    id: string;
  };
  result: 'success' | 'error';
  details?: any;
}

export const auditLog = async (entry: AuditLogEntry): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  const record: AuditRecord = {
    pk: `AUDIT#${timestamp}`,
    sk: `USER#${entry.actor.userId}#ACTION#${entry.action}`,
    timestamp,
    actor: {
      userId: entry.actor.userId,
      vendorId: entry.actor.vendorId,
      roles: entry.actor.roles
    },
    action: entry.action,
    resource: entry.resource,
    result: entry.result,
    details: entry.details
  };

  await putAuditRecord(record);
};
