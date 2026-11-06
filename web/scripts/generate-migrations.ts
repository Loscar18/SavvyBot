import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import fs from "fs";

async function generateMigrations() {
  console.log("🔧 Generating Drizzle migrations...");

  // Create a temporary database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/savvybot",
  });

  const db = drizzle(pool);

  try {
    // Create migrations folder if it doesn't exist
    const migrationsFolder = path.join(__dirname, "..", "drizzle");
    if (!fs.existsSync(migrationsFolder)) {
      fs.mkdirSync(migrationsFolder, { recursive: true });
    }

    // Run migrations (this will create the SQL files)
    await migrate(db, {
      migrationsFolder: migrationsFolder,
    });

    console.log("✅ Migrations generated successfully!");
    console.log(`   Location: ${path.resolve(migrationsFolder)}`);
    
    // List generated files
    const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql'));
    if (files.length > 0) {
      console.log("   Files:");
      files.forEach(f => console.log(`     - ${f}`));
    } else {
      console.log("   Warning: No migration files were generated.");
      console.log("   This might be because the database is already up to date.");
    }

  } catch (error) {
    console.error("❌ Migration generation failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

generateMigrations();
