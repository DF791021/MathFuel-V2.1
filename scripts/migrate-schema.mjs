import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Tables to create (new MathFuel tables)
const createStatements = [
  `CREATE TABLE IF NOT EXISTS mathDomains (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL,
    slug varchar(100) NOT NULL UNIQUE,
    description text,
    icon varchar(50),
    displayOrder int NOT NULL DEFAULT 0,
    gradeLevel int NOT NULL,
    isActive boolean NOT NULL DEFAULT true,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mathSkills (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    domainId int NOT NULL,
    name varchar(200) NOT NULL,
    slug varchar(200) NOT NULL UNIQUE,
    description text,
    gradeLevel int NOT NULL,
    displayOrder int NOT NULL DEFAULT 0,
    prerequisiteSkillId int,
    isActive boolean NOT NULL DEFAULT true,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mathProblems (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    skillId int NOT NULL,
    problemType enum('multiple_choice','numeric_input','true_false','fill_blank','comparison','word_problem','ordering') NOT NULL,
    difficulty int NOT NULL DEFAULT 1,
    questionText text NOT NULL,
    questionImage varchar(500),
    correctAnswer varchar(200) NOT NULL,
    answerType enum('number','text','boolean','choice') NOT NULL,
    choices json,
    explanation text NOT NULL,
    hintSteps json NOT NULL,
    tags varchar(500),
    isActive boolean NOT NULL DEFAULT true,
    timesServed int NOT NULL DEFAULT 0,
    timesCorrect int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS practiceSessions (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    studentId int NOT NULL,
    sessionType enum('daily','practice','review','assessment') NOT NULL DEFAULT 'daily',
    status enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
    totalProblems int NOT NULL DEFAULT 0,
    correctAnswers int NOT NULL DEFAULT 0,
    hintsUsed int NOT NULL DEFAULT 0,
    totalTimeSeconds int NOT NULL DEFAULT 0,
    averageDifficulty int NOT NULL DEFAULT 1,
    skillsFocused json,
    startedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completedAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS problemAttempts (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    sessionId int NOT NULL,
    studentId int NOT NULL,
    problemId int NOT NULL,
    skillId int NOT NULL,
    studentAnswer varchar(200),
    isCorrect boolean NOT NULL,
    isFirstTry boolean NOT NULL DEFAULT true,
    hintsViewed int NOT NULL DEFAULT 0,
    timeSpentSeconds int NOT NULL DEFAULT 0,
    difficulty int NOT NULL,
    attemptNumber int NOT NULL DEFAULT 1,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS studentSkillMastery (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    studentId int NOT NULL,
    skillId int NOT NULL,
    masteryLevel enum('not_started','practicing','close','mastered') NOT NULL DEFAULT 'not_started',
    masteryScore int NOT NULL DEFAULT 0,
    totalAttempts int NOT NULL DEFAULT 0,
    correctAttempts int NOT NULL DEFAULT 0,
    currentStreak int NOT NULL DEFAULT 0,
    bestStreak int NOT NULL DEFAULT 0,
    averageTimeSeconds int NOT NULL DEFAULT 0,
    lastPracticedAt timestamp NULL,
    masteredAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS studentDailyStats (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    studentId int NOT NULL,
    date varchar(10) NOT NULL,
    sessionsCompleted int NOT NULL DEFAULT 0,
    problemsAttempted int NOT NULL DEFAULT 0,
    problemsCorrect int NOT NULL DEFAULT 0,
    hintsUsed int NOT NULL DEFAULT 0,
    totalTimeSeconds int NOT NULL DEFAULT 0,
    skillsImproved int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS studentStreaks (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    studentId int NOT NULL UNIQUE,
    currentStreak int NOT NULL DEFAULT 0,
    longestStreak int NOT NULL DEFAULT 0,
    lastActiveDate varchar(10),
    totalActiveDays int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS studentBadges (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    studentId int NOT NULL,
    badgeType varchar(100) NOT NULL,
    title varchar(200) NOT NULL,
    description text,
    icon varchar(50),
    earnedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS parentStudentLinks (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    parentId int NOT NULL,
    studentId int NOT NULL,
    relationship varchar(50) NOT NULL DEFAULT 'parent',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

// Add userType column if not exists
const alterStatements = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS userType enum('student','parent','teacher','admin') NOT NULL DEFAULT 'student'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS gradeLevel int NULL`,
];

console.log('Creating MathFuel tables...');
for (const sql of createStatements) {
  try {
    await conn.execute(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    console.log(`  ✓ ${tableName}`);
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
  }
}

console.log('Altering users table...');
for (const sql of alterStatements) {
  try {
    await conn.execute(sql);
    console.log(`  ✓ Done`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log(`  ✓ Column already exists`);
    } else {
      console.error(`  ✗ Error:`, err.message);
    }
  }
}

await conn.end();
console.log('Migration complete!');
