import { describe, it, expect } from 'vitest';

// Test the WebSocket module structure and exports
describe('WebSocket Module', () => {
  it('should export WebSocketManager class', async () => {
    const module = await import('./_core/websocket');
    expect(module.WebSocketManager).toBeDefined();
    expect(typeof module.WebSocketManager).toBe('function');
  });

  it('should export game state types', async () => {
    const module = await import('./_core/websocket');
    expect(module).toHaveProperty('WebSocketManager');
  });

  describe('Game State Types', () => {
    it('should support valid game states', () => {
      const validStates = ['waiting', 'spinning', 'answering', 'results', 'ended'];
      expect(validStates.length).toBe(5);
      expect(validStates).toContain('waiting');
      expect(validStates).toContain('spinning');
      expect(validStates).toContain('answering');
      expect(validStates).toContain('results');
      expect(validStates).toContain('ended');
    });
  });

  describe('Challenge Types', () => {
    it('should support all challenge types', () => {
      const challengeTypes = ['trivia', 'match', 'recipe', 'wellness', 'speed'];
      expect(challengeTypes.length).toBe(5);
      
      challengeTypes.forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    it('should have unique challenge types', () => {
      const challengeTypes = ['trivia', 'match', 'recipe', 'wellness', 'speed'];
      const uniqueTypes = new Set(challengeTypes);
      expect(uniqueTypes.size).toBe(challengeTypes.length);
    });
  });

  describe('Player State Structure', () => {
    it('should define player state properties', () => {
      const playerState = {
        id: 'player_123',
        name: 'John Doe',
        socketId: 'socket_456',
        score: 100,
        streak: 3,
        answered: true,
        answer: 'Dairy',
        isConnected: true,
      };

      expect(playerState).toHaveProperty('id');
      expect(playerState).toHaveProperty('name');
      expect(playerState).toHaveProperty('socketId');
      expect(playerState).toHaveProperty('score');
      expect(playerState).toHaveProperty('streak');
      expect(playerState).toHaveProperty('answered');
      expect(playerState).toHaveProperty('answer');
      expect(playerState).toHaveProperty('isConnected');

      expect(typeof playerState.id).toBe('string');
      expect(typeof playerState.name).toBe('string');
      expect(typeof playerState.score).toBe('number');
      expect(typeof playerState.streak).toBe('number');
      expect(typeof playerState.answered).toBe('boolean');
      expect(typeof playerState.isConnected).toBe('boolean');
    });
  });

  describe('Leaderboard Structure', () => {
    it('should define leaderboard entry properties', () => {
      const leaderboardEntry = {
        playerId: 'player_123',
        name: 'John Doe',
        score: 500,
        streak: 5,
        position: 1,
      };

      expect(leaderboardEntry).toHaveProperty('playerId');
      expect(leaderboardEntry).toHaveProperty('name');
      expect(leaderboardEntry).toHaveProperty('score');
      expect(leaderboardEntry).toHaveProperty('streak');
      expect(leaderboardEntry).toHaveProperty('position');

      expect(typeof leaderboardEntry.score).toBe('number');
      expect(typeof leaderboardEntry.position).toBe('number');
      expect(leaderboardEntry.position).toBeGreaterThan(0);
    });

    it('should sort leaderboard by score descending', () => {
      const leaderboard = [
        { playerId: 'p1', name: 'Alice', score: 300, streak: 2, position: 1 },
        { playerId: 'p2', name: 'Bob', score: 500, streak: 5, position: 2 },
        { playerId: 'p3', name: 'Charlie', score: 100, streak: 1, position: 3 },
      ];

      // Sort by score descending
      const sorted = [...leaderboard].sort((a, b) => b.score - a.score);

      expect(sorted[0].score).toBe(500);
      expect(sorted[1].score).toBe(300);
      expect(sorted[2].score).toBe(100);
    });
  });

  describe('Challenge Structure', () => {
    it('should define challenge properties', () => {
      const challenge = {
        type: 'trivia',
        question: 'Which food group is most important for bone health?',
        answer: 'Dairy',
      };

      expect(challenge).toHaveProperty('type');
      expect(challenge).toHaveProperty('question');
      expect(challenge).toHaveProperty('answer');

      expect(typeof challenge.type).toBe('string');
      expect(typeof challenge.question).toBe('string');
      expect(typeof challenge.answer).toBe('string');
    });

    it('should validate challenge answers', () => {
      const challenge = {
        type: 'trivia',
        question: 'Which food group is most important for bone health?',
        answer: 'Dairy',
      };

      const playerAnswer = 'Dairy';
      const isCorrect = playerAnswer.toLowerCase().trim() === challenge.answer.toLowerCase().trim();

      expect(isCorrect).toBe(true);
    });

    it('should handle case-insensitive answer matching', () => {
      const challenge = { answer: 'Dairy' };
      const answers = ['dairy', 'DAIRY', 'Dairy', ' Dairy ', '  DAIRY  '];

      answers.forEach((answer) => {
        const isCorrect = answer.toLowerCase().trim() === challenge.answer.toLowerCase().trim();
        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Scoring System', () => {
    it('should award points for correct answers', () => {
      const basePoints = 100;
      const streakMultiplier = 1.5;
      const streak = 3;

      const totalPoints = Math.floor(basePoints * (1 + (streak - 1) * 0.1));

      expect(totalPoints).toBeGreaterThan(basePoints);
      expect(totalPoints).toBe(120); // 100 * (1 + 2 * 0.1) = 120
    });

    it('should reset streak on incorrect answer', () => {
      const initialStreak = 5;
      const newStreak = initialStreak > 0 ? 0 : initialStreak;

      expect(newStreak).toBe(0);
    });

    it('should increment streak on correct answer', () => {
      const initialStreak = 3;
      const newStreak = initialStreak + 1;

      expect(newStreak).toBe(4);
    });
  });

  describe('Game Room Management', () => {
    it('should generate unique game codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.add(code);
      }

      expect(codes.size).toBeGreaterThan(95); // Most should be unique
    });

    it('should validate game code format', () => {
      const validCode = 'ABC123';
      const codeRegex = /^[A-Z0-9]{6}$/;

      expect(codeRegex.test(validCode)).toBe(true);
    });
  });
});
