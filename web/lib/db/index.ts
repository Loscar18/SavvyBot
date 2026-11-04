import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Drizzle client
export const db = drizzle(pool, { schema });

// Run migrations (for development)
export async function runMigrations() {
  if (process.env.NODE_ENV === "development") {
    try {
      await migrate(db, {
        migrationsFolder: "./drizzle",
      });
      console.log("✅ Database migrations applied");
    } catch (error) {
      console.error("❌ Failed to apply migrations:", error);
    }
  }
}

// Graceful shutdown
export async function closeConnection() {
  await pool.end();
}

// Export schema for type safety
export * from "./schema";

export default db;
