import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "@/lib/db/query";
import { getSessionConfig } from "@/lib/env";
import type { Administrator, AdministratorRole, RequestMetadata } from "./types";

const ADMIN_SESSION_COOKIE = "n7_admin_session";

interface SessionRow extends RowDataPacket {
  session_id: string;
  administrator_id: string;
  name: string;
  email: string;
  role: AdministratorRole;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdministratorSession(
  administratorId: string,
  metadata: RequestMetadata,
): Promise<void> {
  const config = getSessionConfig();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.durationHours * 60 * 60 * 1000);

  await executeMutation(
    `INSERT INTO admin_sessions
       (administrator_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [administratorId, tokenHash, expiresAt, metadata.ipAddress, metadata.userAgent],
  );

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function getCurrentAdministrator(): Promise<Administrator | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await selectOne<SessionRow>(
    `SELECT
       CAST(s.id AS CHAR) AS session_id,
       CAST(a.id AS CHAR) AS administrator_id,
       a.name,
       a.email,
       a.role
     FROM admin_sessions s
     INNER JOIN administrators a ON a.id = s.administrator_id
     WHERE s.token_hash = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > CURRENT_TIMESTAMP(3)
       AND a.status = 'ACTIVE'
     LIMIT 1`,
    [hashToken(token)],
  );

  if (!session) return null;

  await executeMutation(
    `UPDATE admin_sessions
     SET last_seen_at = CURRENT_TIMESTAMP(3)
     WHERE id = ? AND last_seen_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE)`,
    [session.session_id],
  );

  return {
    id: session.administrator_id,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}

export async function requireAdministrator(
  allowedRoles?: readonly AdministratorRole[],
): Promise<Administrator> {
  const administrator = await getCurrentAdministrator();
  if (!administrator) redirect("/admin/login");
  if (allowedRoles && !allowedRoles.includes(administrator.role)) redirect("/admin?denied=1");
  return administrator;
}

export async function revokeCurrentAdministratorSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await executeMutation(
      `UPDATE admin_sessions
       SET revoked_at = CURRENT_TIMESTAMP(3)
       WHERE token_hash = ? AND revoked_at IS NULL`,
      [hashToken(token)],
    );
  }

  cookieStore.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
}
