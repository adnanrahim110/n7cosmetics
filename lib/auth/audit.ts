import { executeMutation } from "@/lib/db/query";
import type { SqlValue } from "@/lib/db/query";

interface AuditEvent {
  administratorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  const values: SqlValue[] = [
    event.administratorId ?? null,
    event.action,
    event.entityType,
    event.entityId ?? null,
    event.summary,
    event.metadata ? JSON.stringify(event.metadata) : null,
    event.ipAddress ?? null,
  ];

  await executeMutation(
    `INSERT INTO audit_logs
       (administrator_id, action, entity_type, entity_id, summary, metadata_json, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    values,
  );
}
