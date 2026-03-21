import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS passwordResetTokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expiresAt TIMESTAMP NOT NULL,
      usedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Created passwordResetTokens table");

  const [cols] = await conn.execute("DESCRIBE passwordResetTokens");
  console.log("\n📋 passwordResetTokens columns:");
  for (const col of cols) {
    console.log(`  ${col.Field}: ${col.Type}`);
  }

  await conn.end();
  console.log("\n✅ Migration complete!");
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
