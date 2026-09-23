import { createHash } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";
import type { EmailPreferences } from "./brand";
import { enqueueEmail } from "./queue";
import type { ProjectEmail } from "./service";
import { notificationRecipients, type NotificationType } from "./settings";

export async function enqueueStoreNotification(brand: EmailPreferences, type: NotificationType, email: Omit<ProjectEmail, "to">, event: string, connection?: PoolConnection): Promise<void> {
  for (const recipient of notificationRecipients(brand.notifications, type)) {
    const recipientKey = createHash("sha256").update(recipient).digest("hex").slice(0, 24);
    await enqueueEmail({ ...email, to: recipient, notificationType: type }, { dedupeKey: `notification:${type}:${event}:${recipientKey}` }, connection);
  }
}
