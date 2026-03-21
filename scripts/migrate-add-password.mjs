import mysql from "mysql2/promise";
import "dotenv/config";

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Add passwordHash column if it doesn't exist
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordHash'`
  );
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE users ADD COLUMN passwordHash varchar(255) NULL AFTER loginMethod`);
    console.log("Added passwordHash column to users table");
  } else {
    console.log("passwordHash column already exists");
  }

  await conn.end();
  console.log("Migration complete");
}

run().catch(console.error);
