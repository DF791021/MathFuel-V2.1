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

  // Create inviteCodes table for parent-child linking
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS inviteCodes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studentId INT NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE,
      expiresAt TIMESTAMP NOT NULL,
      usedBy INT NULL,
      usedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Created inviteCodes table");

  // Add unique constraint to parentStudentLinks to prevent duplicate links
  try {
    await conn.execute(`
      ALTER TABLE parentStudentLinks ADD UNIQUE INDEX idx_parent_student (parentId, studentId)
    `);
    console.log("✅ Added unique index to parentStudentLinks");
  } catch (e) {
    if (e.code === "ER_DUP_KEYNAME") {
      console.log("⏭️  Unique index already exists on parentStudentLinks");
    } else {
      console.error("❌ Error adding unique index:", e.message);
    }
  }

  const [cols] = await conn.execute("DESCRIBE inviteCodes");
  console.log("\n📋 inviteCodes columns:");
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
