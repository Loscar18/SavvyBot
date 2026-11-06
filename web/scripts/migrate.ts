import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";
import fs from "fs";

async function main() {
  console.log("🚀 Running database migrations...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/savvybot",
    // For Neon, we need to handle connection timeouts
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 1, // Single connection for migrations
  });

  const db = drizzle(pool);

  try {
    // Check if migrations folder exists
    const migrationsFolder = path.join(__dirname, "..", "drizzle");
    if (!fs.existsSync(migrationsFolder)) {
      console.error("❌ Drizzle migrations folder not found!");
      console.log("   Expected at:", path.resolve(migrationsFolder));
      console.log("   Please run: npx drizzle-kit generate");
      process.exit(1);
    }

    await migrate(db, {
      migrationsFolder: migrationsFolder,
    });

    console.log("✅ Migrations completed successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    if (error.message.includes("relation") || error.message.includes("already exists")) {
      console.log("   Note: Some tables may already exist. This is OK for initial setup.");
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
