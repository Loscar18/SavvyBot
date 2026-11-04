import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";

async function main() {
  console.log("🚀 Running database migrations...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/savvybot",
  });

  const db = drizzle(pool);

  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "..", "drizzle"),
    });

    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
