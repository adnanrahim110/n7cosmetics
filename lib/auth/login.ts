import { compare } from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { executeMutation, selectOne } from "@/lib/db/query";
import { writeAuditLog } from "./audit";
import { createAdministratorSession } from "./session";
import type { AdministratorRole, RequestMetadata } from "./types";

const DUMMY_PASSWORD_HASH = "$2b$12$fCTLiL.DvN4wD.YgXUcSy.wwUGqBgWIou8OsYE5TjTqt1QNlqu8xK";
const MAX_FAILURES = 5;

const credentialsSchema = z.object({
  email: z.email().max(190).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

interface LoginCountRow extends RowDataPacket {
  attempt_count: number;
}

interface AdministratorCredentialRow extends RowDataPacket {
  id: string;
  password_hash: string;
  role: AdministratorRole;
  status: "ACTIVE" | "DISABLED";
}

export type LoginResult = "SUCCESS" | "INVALID" | "RATE_LIMITED";

export async function authenticateAdministrator(
  rawCredentials: unknown,
  metadata: RequestMetadata,
): Promise<LoginResult> {
  const parsed = credentialsSchema.safeParse(rawCredentials);
  if (!parsed.success) return "INVALID";

  const { email, password } = parsed.data;
  const recentFailures = await selectOne<LoginCountRow>(
    `SELECT COUNT(*) AS attempt_count
     FROM admin_login_attempts
     WHERE email = ?
       AND ip_address = ?
       AND succeeded = 0
       AND attempted_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 15 MINUTE)`,
    [email, metadata.ipAddress],
  );

  if (Number(recentFailures?.attempt_count ?? 0) >= MAX_FAILURES) {
    return "RATE_LIMITED";
  }

  const administrator = await selectOne<AdministratorCredentialRow>(
    `SELECT CAST(id AS CHAR) AS id, password_hash, role, status
     FROM administrators
     WHERE email = ?
     LIMIT 1`,
    [email],
  );
  const passwordMatches = await compare(password, administrator?.password_hash ?? DUMMY_PASSWORD_HASH);
  const canLogIn = passwordMatches && administrator?.status === "ACTIVE";

  await executeMutation(
    `INSERT INTO admin_login_attempts (email, ip_address, succeeded)
     VALUES (?, ?, ?)`,
    [email, metadata.ipAddress, canLogIn],
  );

  if (!canLogIn || !administrator) return "INVALID";

  await executeMutation(
    `UPDATE administrators
     SET last_login_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [administrator.id],
  );
  await executeMutation(
    `DELETE FROM admin_login_attempts
     WHERE email = ? AND ip_address = ? AND succeeded = 0`,
    [email, metadata.ipAddress],
  );
  await createAdministratorSession(administrator.id, metadata);
  await writeAuditLog({
    administratorId: administrator.id,
    action: "ADMIN_LOGIN",
    entityType: "administrator",
    entityId: administrator.id,
    summary: "Administrator signed in",
    ipAddress: metadata.ipAddress,
  });

  return "SUCCESS";
}
