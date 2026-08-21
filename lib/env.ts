import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(10),
  DB_SSL: z.enum(["true", "false"]).default("false"),
});

const sessionEnvironmentSchema = z.object({
  ADMIN_SESSION_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  ADMIN_COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
});

const applicationEnvironmentSchema = z.object({
  APP_URL: z.url().default("http://localhost:3003"),
  APP_ENCRYPTION_KEY: z.string().min(1),
  UPLOAD_DIR: z.string().min(1).default("public/uploads"),
  UPLOAD_PUBLIC_PATH: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).default("/uploads"),
});

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit: number;
  ssl: boolean;
}

export interface SessionConfig {
  durationHours: number;
  secureCookie: boolean;
}

export interface ApplicationConfig {
  appUrl: string;
  encryptionKey: Buffer;
  uploadDirectory: string;
  uploadPublicPath: string;
}

let cachedDatabaseConfig: DatabaseConfig | undefined;
let cachedSessionConfig: SessionConfig | undefined;
let cachedApplicationConfig: ApplicationConfig | undefined;

export function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_NAME &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD !== undefined,
  );
}

export function getDatabaseConfig(): DatabaseConfig {
  if (cachedDatabaseConfig) return cachedDatabaseConfig;

  const parsed = databaseEnvironmentSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid MySQL configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  }

  cachedDatabaseConfig = {
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
    database: parsed.data.DB_NAME,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
    connectionLimit: parsed.data.DB_CONNECTION_LIMIT,
    ssl: parsed.data.DB_SSL === "true",
  };

  return cachedDatabaseConfig;
}

export function getSessionConfig(): SessionConfig {
  if (cachedSessionConfig) return cachedSessionConfig;

  const parsed = sessionEnvironmentSchema.parse(process.env);
  cachedSessionConfig = {
    durationHours: parsed.ADMIN_SESSION_HOURS,
    secureCookie: parsed.ADMIN_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  };
  return cachedSessionConfig;
}

export function getApplicationConfig(): ApplicationConfig {
  if (cachedApplicationConfig) return cachedApplicationConfig;
  const parsed = applicationEnvironmentSchema.parse(process.env);
  const encryptionKey = Buffer.from(parsed.APP_ENCRYPTION_KEY, "base64");
  if (encryptionKey.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  cachedApplicationConfig = {
    appUrl: parsed.APP_URL.replace(/\/$/, ""),
    encryptionKey,
    uploadDirectory: parsed.UPLOAD_DIR,
    uploadPublicPath: parsed.UPLOAD_PUBLIC_PATH.replace(/\/$/, ""),
  };
  return cachedApplicationConfig;
}
