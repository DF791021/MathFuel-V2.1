import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  recordHistoricalSnapshot,
  getHistoricalSnapshots,
  calculateStudentImprovement,
  getStudentImprovement,
  calculateClassImprovement,
  getClassImprovement,
  recordStudentRanking,
  getStudentRankingHistory,
  recordPerformanceMilestone,
  getStudentMilestones,
  getClassMilestones,
  getTopImprovingStudents,
  getStudentsNeedingAttention,
} from "./db";

describe("Comparative Analytics Functions", () => {
  const testPlayerId = 999;
  const testPlayerName = "Test Student";
  const testTeacherId = 888;
  const testClassId = 777;

  beforeAll(async () => {
    // Setup test data
    console.log("Setting up test data for comparative analytics");
  });

  afterAll(async () => {
    // Cleanup
    console.log("Cleaning up test data");
  });

  describe("Historical Snapshots", () => {
    it("should record a historical snapshot", async () => {
      await recordHistoricalSnapshot(testPlayerId, testPlayerName, testTeacherId, {
        totalGamesPlayed: 10,
        accuracyRate: 85,
        averageScore: 750,
        totalCorrectAnswers: 85,
        totalAnswers: 100,
        streakCount: 5,
        averageTimePerGame: 120,
      });

      const snapshots = await getHistoricalSnapshots(testPlayerId, 1);
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0].playerId).toBe(testPlayerId);
      expect(snapshots[0].accuracyRate).toBe(85);
    });

    it("should retrieve multiple historical snapshots in reverse chronological order", async () => {
      // Record multiple snapshots
      for (let i = 0; i < 3; i++) {
        await recordHistoricalSnapshot(
          testPlayerId + 1,
          "Test Student 2",
          testTeacherId,
          {
            totalGamesPlayed: 10 + i,
            accuracyRate: 80 + i * 2,
            averageScore: 700 + i * 50,
            totalCorrectAnswers: 80 + i * 2,
            totalAnswers: 100,
            streakCount: 3 + i,
            averageTimePerGame: 120,
          }
        );
      }

      const snapshots = await getHistoricalSnapshots(testPlayerId + 1, 10);
      expect(snapshots.length).toBeGreaterThanOrEqual(3);
      
      // Verify reverse chronological order
      for (let i = 0; i < snapshots.length - 1; i++) {
        expect(
          new Date(snapshots[i].snapshotDate).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(snapshots[i + 1].snapshotDate).getTime()
        );
      }
    });

    it("should respect the limit parameter", async () => {
      const snapshots = await getHistoricalSnapshots(testPlayerId + 1, 2);
      expect(snapshots.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Student Improvement Metrics", () => {
    it("should calculate student improvement for a period", async () => {
      const improvement = await calculateStudentImprovement(
        testPlayerId + 2,
        "Test Student 3",
        testTeacherId,
        "month"
      );

      if (improvement) {
        expect(improvement.playerId).toBe(testPlayerId + 2);
        expect(improvement.period).toBe("month");
        expect(typeof improvement.improvementPercentage).toBe("number");
        expect(improvement.improvementPercentage).toBeGreaterThanOrEqual(0);
        expect(improvement.improvementPercentage).toBeLessThanOrEqual(100);
      }
    });

    it("should identify improvement trend correctly", async () => {
      const improvement = await calculateStudentImprovement(
        testPlayerId + 3,
        "Test Student 4",
        testTeacherId,
        "week"
      );

      if (improvement) {
        expect(["improving", "stable", "declining"]).toContain(
          improvement.improvementTrend
        );
      }
    });

    it("should retrieve student improvement metrics", async () => {
      // First calculate improvement
      await calculateStudentImprovement(
        testPlayerId + 4,
        "Test Student 5",
        testTeacherId,
        "month"
      );

      // Then retrieve
      const improvements = await getStudentImprovement(testPlayerId + 4, "month");
      expect(Array.isArray(improvements)).toBe(true);
    });

    it("should filter improvements by period", async () => {
      const weekImprovements = await getStudentImprovement(
        testPlayerId + 4,
        "week"
      );
      const monthImprovements = await getStudentImprovement(
        testPlayerId + 4,
        "month"
      );

      // Both should be arrays
      expect(Array.isArray(weekImprovements)).toBe(true);
      expect(Array.isArray(monthImprovements)).toBe(true);
    });
  });

  describe("Class Improvement Metrics", () => {
    it("should calculate class improvement metrics", async () => {
      await calculateClassImprovement(
        testClassId,
        "Test Class",
        testTeacherId,
        "month"
      );

      const improvements = await getClassImprovement(testClassId, "month");
      expect(Array.isArray(improvements)).toBe(true);
    });

    it("should track student trend distribution", async () => {
      await calculateClassImprovement(
        testClassId + 1,
        "Test Class 2",
        testTeacherId,
        "month"
      );

      const improvements = await getClassImprovement(testClassId + 1, "month");
      if (improvements.length > 0) {
        const improvement = improvements[0];
        expect(improvement.improvingStudentCount).toBeGreaterThanOrEqual(0);
        expect(improvement.stableStudentCount).toBeGreaterThanOrEqual(0);
        expect(improvement.decliningStudentCount).toBeGreaterThanOrEqual(0);
      }
    });

    it("should filter class improvements by period", async () => {
      const weekImprovements = await getClassImprovement(testClassId + 1, "week");
      const monthImprovements = await getClassImprovement(
        testClassId + 1,
        "month"
      );

      expect(Array.isArray(weekImprovements)).toBe(true);
      expect(Array.isArray(monthImprovements)).toBe(true);
    });
  });

  describe("Student Ranking History", () => {
    it("should record student ranking", async () => {
      await recordStudentRanking(
        testPlayerId + 5,
        "Test Student 6",
        testClassId,
        testTeacherId,
        1,
        1000,
        95,
        10
      );

      const history = await getStudentRankingHistory(testPlayerId + 5, 1);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].playerId).toBe(testPlayerId + 5);
      expect(history[0].currentRank).toBe(1);
    });

    it("should track rank changes", async () => {
      const playerId = testPlayerId + 6;

      // Record first ranking
      await recordStudentRanking(
        playerId,
        "Test Student 7",
        testClassId,
        testTeacherId,
        5,
        800,
        85,
        8
      );

      // Record second ranking with improved rank
      await recordStudentRanking(
        playerId,
        "Test Student 7",
        testClassId,
        testTeacherId,
        3,
        900,
        90,
        10
      );

      const history = await getStudentRankingHistory(playerId, 10);
      expect(history.length).toBeGreaterThanOrEqual(2);

      // Most recent should show rank change
      if (history.length >= 2) {
        // rankChange is calculated as previousRank - currentRank
        // So if rank improved (from 5 to 3), rankChange should be positive (5 - 3 = 2)
        expect(history[0].rankChange).toBeGreaterThanOrEqual(0); // Improved
      }
    });

    it("should retrieve ranking history in reverse chronological order", async () => {
      const history = await getStudentRankingHistory(testPlayerId + 5, 10);

      for (let i = 0; i < history.length - 1; i++) {
        expect(
          new Date(history[i].recordDate).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(history[i + 1].recordDate).getTime()
        );
      }
    });
  });

  describe("Performance Milestones", () => {
    it("should record a performance milestone", async () => {
      await recordPerformanceMilestone(
        testPlayerId + 7,
        "Test Student 8",
        testTeacherId,
        "accuracy_90",
        "Achieved 90% accuracy",
        50
      );

      const milestones = await getStudentMilestones(testPlayerId + 7, 1);
      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones[0].playerId).toBe(testPlayerId + 7);
      expect(milestones[0].rewardPoints).toBe(50);
    });

    it("should retrieve multiple milestones", async () => {
      const playerId = testPlayerId + 8;

      // Record multiple milestones
      await recordPerformanceMilestone(
        playerId,
        "Test Student 9",
        testTeacherId,
        "first_game",
        "Played first game",
        10
      );

      await recordPerformanceMilestone(
        playerId,
        "Test Student 9",
        testTeacherId,
        "games_10",
        "Played 10 games",
        25
      );

      const milestones = await getStudentMilestones(playerId, 10);
      expect(milestones.length).toBeGreaterThanOrEqual(2);
    });

    it("should retrieve class milestones", async () => {
      const milestones = await getClassMilestones(testTeacherId, 10);
      expect(Array.isArray(milestones)).toBe(true);
    });

    it("should respect the limit parameter for milestones", async () => {
      const milestones = await getClassMilestones(testTeacherId, 3);
      expect(milestones.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Top Performers and At-Risk Students", () => {
    it("should retrieve top improving students", async () => {
      const improving = await getTopImprovingStudents(testTeacherId, "month", 5);
      expect(Array.isArray(improving)).toBe(true);

      if (improving.length > 0) {
        // Verify sorted by improvement percentage
        for (let i = 0; i < improving.length - 1; i++) {
          expect(improving[i].improvementPercentage).toBeGreaterThanOrEqual(
            improving[i + 1].improvementPercentage
          );
        }
      }
    });

    it("should retrieve students needing attention", async () => {
      const declining = await getStudentsNeedingAttention(testTeacherId, "month", 5);
      expect(Array.isArray(declining)).toBe(true);

      if (declining.length > 0) {
        // All should have declining trend
        declining.forEach((student) => {
          expect(student.improvementTrend).toBe("declining");
        });
      }
    });

    it("should filter by period", async () => {
      const weekImproving = await getTopImprovingStudents(testTeacherId, "week", 5);
      const monthImproving = await getTopImprovingStudents(testTeacherId, "month", 5);

      expect(Array.isArray(weekImproving)).toBe(true);
      expect(Array.isArray(monthImproving)).toBe(true);
    });

    it("should respect the limit parameter", async () => {
      const improving = await getTopImprovingStudents(testTeacherId, "month", 3);
      expect(improving.length).toBeLessThanOrEqual(3);

      const declining = await getStudentsNeedingAttention(testTeacherId, "month", 3);
      expect(declining.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data consistency across multiple operations", async () => {
      const playerId = testPlayerId + 100;
      const playerName = "Consistency Test Student";

      // Record snapshot
      await recordHistoricalSnapshot(
        playerId,
        playerName,
        testTeacherId,
        {
          totalGamesPlayed: 15,
          accuracyRate: 88,
          averageScore: 850,
          totalCorrectAnswers: 88,
          totalAnswers: 100,
          streakCount: 7,
          averageTimePerGame: 110,
        }
      );

      // Record ranking
      await recordStudentRanking(
        playerId,
        playerName,
        testClassId,
        testTeacherId,
        2,
        850,
        88,
        15
      );

      // Record milestone
      await recordPerformanceMilestone(
        playerId,
        playerName,
        testTeacherId,
        "accuracy_95",
        "Achieved 95% accuracy",
        100
      );

      // Verify all data is retrievable
      const snapshots = await getHistoricalSnapshots(playerId, 1);
      const ranking = await getStudentRankingHistory(playerId, 1);
      const milestones = await getStudentMilestones(playerId, 1);

      expect(snapshots.length).toBeGreaterThan(0);
      expect(ranking.length).toBeGreaterThan(0);
      expect(milestones.length).toBeGreaterThan(0);

      // Verify data integrity
      expect(snapshots[0].playerId).toBe(playerId);
      expect(ranking[0].playerId).toBe(playerId);
      expect(milestones[0].playerId).toBe(playerId);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero values correctly", async () => {
      const playerId = testPlayerId + 200;

      await recordHistoricalSnapshot(
        playerId,
        "Zero Test Student",
        testTeacherId,
        {
          totalGamesPlayed: 0,
          accuracyRate: 0,
          averageScore: 0,
          totalCorrectAnswers: 0,
          totalAnswers: 0,
          streakCount: 0,
          averageTimePerGame: 0,
        }
      );

      const snapshots = await getHistoricalSnapshots(playerId, 1);
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0].accuracyRate).toBe(0);
    });

    it("should handle maximum values correctly", async () => {
      const playerId = testPlayerId + 201;

      await recordHistoricalSnapshot(
        playerId,
        "Max Test Student",
        testTeacherId,
        {
          totalGamesPlayed: 999,
          accuracyRate: 100,
          averageScore: 10000,
          totalCorrectAnswers: 999,
          totalAnswers: 999,
          streakCount: 999,
          averageTimePerGame: 3600,
        }
      );

      const snapshots = await getHistoricalSnapshots(playerId, 1);
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0].accuracyRate).toBe(100);
    });

    it("should handle non-existent student gracefully", async () => {
      const nonExistentId = 999999;

      const snapshots = await getHistoricalSnapshots(nonExistentId, 10);
      expect(snapshots).toEqual([]);

      const improvements = await getStudentImprovement(nonExistentId);
      expect(improvements).toEqual([]);

      const ranking = await getStudentRankingHistory(nonExistentId, 10);
      expect(ranking).toEqual([]);

      const milestones = await getStudentMilestones(nonExistentId, 10);
      expect(milestones).toEqual([]);
    });
  });
});
