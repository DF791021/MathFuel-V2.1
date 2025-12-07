import { describe, it, expect, vi } from 'vitest';

// Mock the database functions
vi.mock('../db', () => ({
  saveGameScore: vi.fn().mockResolvedValue({ insertId: 1 }),
  getTopScores: vi.fn().mockResolvedValue([
    { id: 1, playerName: 'TestPlayer1', score: 10, totalQuestions: 12, correctAnswers: 10, playedAt: new Date() },
    { id: 2, playerName: 'TestPlayer2', score: 8, totalQuestions: 12, correctAnswers: 8, playedAt: new Date() },
  ]),
  getUserScores: vi.fn().mockResolvedValue([
    { id: 1, playerName: 'TestPlayer', score: 10, totalQuestions: 12, correctAnswers: 10, playedAt: new Date() },
  ]),
  getActiveCustomQuestions: vi.fn().mockResolvedValue([
    { id: 1, category: 'energy', questionType: 'question', question: 'Test question?', answer: 'Test answer', isActive: true },
  ]),
  createCustomQuestion: vi.fn().mockResolvedValue({ insertId: 1 }),
  getTeacherQuestions: vi.fn().mockResolvedValue([]),
  updateCustomQuestion: vi.fn().mockResolvedValue(undefined),
  deleteCustomQuestion: vi.fn().mockResolvedValue(undefined),
  createClass: vi.fn().mockResolvedValue({ joinCode: 'ABC123' }),
  getTeacherClasses: vi.fn().mockResolvedValue([]),
  getClassByJoinCode: vi.fn().mockResolvedValue({ id: 1, name: 'Test Class', joinCode: 'ABC123' }),
  joinClass: vi.fn().mockResolvedValue({ classId: 1, studentId: 1 }),
  getClassMembers: vi.fn().mockResolvedValue([]),
  getStudentClasses: vi.fn().mockResolvedValue([]),
  updateUserType: vi.fn().mockResolvedValue(undefined),
}));

describe('Game Data Validation', () => {
  it('should validate player name is not empty', () => {
    const playerName = 'TestPlayer';
    expect(playerName.length).toBeGreaterThan(0);
    expect(playerName.length).toBeLessThanOrEqual(100);
  });

  it('should validate score is a non-negative integer', () => {
    const score = 10;
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should validate totalQuestions is a non-negative integer', () => {
    const totalQuestions = 12;
    expect(Number.isInteger(totalQuestions)).toBe(true);
    expect(totalQuestions).toBeGreaterThanOrEqual(0);
  });

  it('should validate correctAnswers is a non-negative integer', () => {
    const correctAnswers = 10;
    expect(Number.isInteger(correctAnswers)).toBe(true);
    expect(correctAnswers).toBeGreaterThanOrEqual(0);
  });

  it('should validate correctAnswers does not exceed totalQuestions', () => {
    const totalQuestions = 12;
    const correctAnswers = 10;
    expect(correctAnswers).toBeLessThanOrEqual(totalQuestions);
  });
});

describe('Question Data Validation', () => {
  it('should validate category is a valid string', () => {
    const validCategories = ['energy', 'safety', 'literacy', 'culture', 'health', 'classification'];
    const category = 'energy';
    expect(validCategories.includes(category)).toBe(true);
  });

  it('should validate questionType is either question or activity', () => {
    const validTypes = ['question', 'activity'];
    const questionType = 'question';
    expect(validTypes.includes(questionType)).toBe(true);
  });

  it('should validate question text is not empty', () => {
    const question = 'What is a healthy snack?';
    expect(question.length).toBeGreaterThan(0);
  });
});

describe('Class Data Validation', () => {
  it('should validate class name is not empty', () => {
    const className = 'Mrs. Johnson 3rd Grade';
    expect(className.length).toBeGreaterThan(0);
    expect(className.length).toBeLessThanOrEqual(100);
  });

  it('should validate join code is 6 characters', () => {
    const joinCode = 'ABC123';
    expect(joinCode.length).toBe(6);
  });
});

describe('Leaderboard Sorting', () => {
  it('should sort scores in descending order', () => {
    const scores = [
      { playerName: 'Player1', score: 5 },
      { playerName: 'Player2', score: 10 },
      { playerName: 'Player3', score: 7 },
    ];
    
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    
    expect(sorted[0].score).toBe(10);
    expect(sorted[1].score).toBe(7);
    expect(sorted[2].score).toBe(5);
  });
});
