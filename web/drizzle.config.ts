import type { Config } from "drizzle-kit";

const config: Config = {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/savvybot",
  },
  // Print all statements
  verbose: true,
  // Always ask for confirmation
  strict: true,
};

export default config;
