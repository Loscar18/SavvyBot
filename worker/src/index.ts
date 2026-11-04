#!/usr/bin/env node

/**
 * SavvyBot Worker
 * Background job processor for agent turns, routines, and tool calls
 */

import { initializeQueues, createWorkers, getQueue, QUEUE_NAMES } from "../../web/lib/queue";
import { db } from "../../web/lib/db";
import { runMigrations } from "../../web/lib/db";
import { encrypt, decrypt } from "../../web/lib/crypto";

// Initialize the worker
async function main() {
  console.log("🚀 Starting SavvyBot Worker...");

  // Run database migrations
  try {
    await runMigrations();
    console.log("✅ Database migrations applied");
  } catch (error) {
    console.error("❌ Failed to apply migrations:", error);
    process.exit(1);
  }

  // Test database connection
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }

  // Initialize queues
  try {
    initializeQueues();
    console.log("✅ Queues initialized");
  } catch (error) {
    console.error("❌ Failed to initialize queues:", error);
    process.exit(1);
  }

  // Create workers
  try {
    const workers = createWorkers();
    console.log("✅ Workers created");
    
    // Log worker info
    Object.entries(workers).forEach(([name, worker]) => {
      console.log(`  - ${name}: ${worker.name}`);
    });
  } catch (error) {
    console.error("❌ Failed to create workers:", error);
    process.exit(1);
  }

  // Test encryption
  try {
    const testKey = process.env.ENCRYPTION_KEY || "test_key_32_bytes_long_123456";
    const testData = "Hello, World!";
    const encrypted = encrypt(testData, testKey);
    const decrypted = decrypt(encrypted, testKey);
    
    if (decrypted !== testData) {
      throw new Error("Encryption test failed");
    }
    
    console.log("✅ Encryption working");
  } catch (error) {
    console.error("❌ Encryption test failed:", error);
    process.exit(1);
  }

  // Log ready message
  console.log("\n" + "=".repeat(50));
  console.log("✨ SavvyBot Worker is running!");
  console.log("=".repeat(50));
  console.log("\nProcessing queues:");
  console.log(`  - ${QUEUE_NAMES.AGENT_TURNS}`);
  console.log(`  - ${QUEUE_NAMES.ROUTINES}`);
  console.log(`  - ${QUEUE_NAMES.TOOL_CALLS}`);
  console.log(`  - ${QUEUE_NAMES.NOTIFICATIONS}`);
  console.log("\nPress Ctrl+C to stop");
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection:", reason);
  process.exit(1);
});

// Start the worker
main().catch((error) => {
  console.error("❌ Worker failed to start:", error);
  process.exit(1);
});

// Import sql for database test
import { sql } from "drizzle-orm";
