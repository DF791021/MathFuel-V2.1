import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function migrate() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log("Creating aiFeedback table...");
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS aiFeedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studentId INT NOT NULL,
      sessionId INT,
      problemId INT,
      responseType ENUM('hint', 'explanation', 'session_summary') NOT NULL,
      rating ENUM('up', 'down') NOT NULL,
      aiResponseText TEXT,
      comment TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student (studentId),
      INDEX idx_session (sessionId),
      INDEX idx_response_type (responseType),
      INDEX idx_rating (rating),
      INDEX idx_created (createdAt)
    )
  `);
  
  console.log("aiFeedback table created successfully!");
  await conn.end();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
