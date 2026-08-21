import "./load-env";
import { hash } from "bcryptjs";
import { z } from "zod";
import { executeMutation } from "../lib/db/query";
import { getPool } from "../lib/db/pool";

const administratorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});

async function createAdministrator(): Promise<void> {
  const administrator = administratorSchema.parse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  const passwordHash = await hash(administrator.password, 12);

  await executeMutation(
    `INSERT INTO administrators (name, email, password_hash, role, status)
     VALUES (?, ?, ?, 'OWNER', 'ACTIVE')
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       status = 'ACTIVE',
       updated_at = CURRENT_TIMESTAMP(3)`,
    [administrator.name, administrator.email, passwordHash],
  );

  process.stdout.write(`Administrator ready: ${administrator.email}\n`);
  await getPool().end();
}

createAdministrator().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
  await getPool().end().catch(() => undefined);
});
