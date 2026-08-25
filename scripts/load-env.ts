import { loadEnvFile } from "node:process";

for (const environmentFile of [".env.local", ".env"]) {
  try {
    loadEnvFile(environmentFile);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
}
