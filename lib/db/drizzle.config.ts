import { defineConfig } from "drizzle-kit";
import path from "path";
import { config as dotenvConfig } from "dotenv";

// drizzle-kit bundles this config in a CJS context and provides __dirname.
// Load .env from the project root (two levels up from lib/db/).
// This is silently skipped when the file doesn't exist (e.g. Replit injects env vars directly).
dotenvConfig({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Create a .env file at the project root with:\nDATABASE_URL=postgresql://user:password@host:5432/dbname",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
