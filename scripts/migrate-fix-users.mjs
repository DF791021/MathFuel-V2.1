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

  // 1. Add avatarUrl column if missing
  try {
    await conn.execute(`
      ALTER TABLE users ADD COLUMN avatarUrl varchar(500) NULL AFTER role
    `);
    console.log("✅ Added avatarUrl column");
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("⏭️  avatarUrl column already exists");
    } else {
      console.error("❌ Error adding avatarUrl:", e.message);
    }
  }

  // 2. Fix userType enum to include 'parent'
  // The current enum is ('student','teacher','admin') — need to add 'parent'
  try {
    await conn.execute(`
      ALTER TABLE users MODIFY COLUMN userType enum('student','parent','teacher','admin') NOT NULL DEFAULT 'student'
    `);
    console.log("✅ Updated userType enum to include 'parent'");
  } catch (e) {
    console.error("❌ Error updating userType enum:", e.message);
  }

  // 3. Verify the fix
  const [cols] = await conn.execute("DESCRIBE users");
  console.log("\n📋 Updated users table columns:");
  for (const col of cols) {
    console.log(`  ${col.Field}: ${col.Type} ${col.Null === "YES" ? "NULL" : "NOT NULL"} ${col.Default ? `DEFAULT ${col.Default}` : ""}`);
  }

  await conn.end();
  console.log("\n✅ Migration complete!");
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
