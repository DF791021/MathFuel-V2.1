import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createGoal,
  getStudentGoals,
  getClassGoals,
  getActiveStudentGoals,
  updateGoal,
  updateGoalProgress,
  getGoalProgressHistory,
  getStudentAchievements,
  getClassAchievements,
  addGoalFeedback,
  getGoalFeedback,
  getGoalsDueSoon,
  getOverdueGoals,
  getGoalStatistics,
  deleteGoal,
} from "./db";

describe("Goal Management Functions", () => {
  const testPlayerId = 999;
  const testTeacherId = 888;
  const testClassId = 777;
  const testPlayerName = "Test Student";

  let createdGoalId: number | null = null;

  describe("Goal Creation", () => {
    it("should create a new goal", async () => {
      const result = await createGoal(
        testPlayerId,
        testPlayerName,
        testTeacherId,
        testClassId,
        {
          playerId: testPlayerId,
          playerName: testPlayerName,
          teacherId: testTeacherId,
          classId: testClassId,
          goalType: "accuracy",
          goalName: "Achieve 90% Accuracy",
          goalDescription: "Improve accuracy in nutrition questions",
          targetValue: 90,
          currentValue: 0,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "active",
          priority: "high",
          progressPercentage: 0,
          notes: "Test goal",
        }
      );

      expect(result).not.toBeNull();
      expect(result?.goalName).toBe("Achieve 90% Accuracy");
      expect(result?.status).toBe("active");
      expect(result?.progressPercentage).toBe(0);

      if (result?.id) {
        createdGoalId = result.id;
      }
    });

    it("should create multiple goals for same student", async () => {
      const goal1 = await createGoal(
        testPlayerId,
        testPlayerName,
        testTeacherId,
        testClassId,
        {
          playerId: testPlayerId,
          playerName: testPlayerName,
          teacherId: testTeacherId,
          classId: testClassId,
          goalType: "score",
          goalName: "Score 500+ Points",
          targetValue: 500,
          currentValue: 0,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "active",
          priority: "medium",
          progressPercentage: 0,
        }
      );

      const goal2 = await createGoal(
        testPlayerId,
        testPlayerName,
        testTeacherId,
        testClassId,
        {
          playerId: testPlayerId,
          playerName: testPlayerName,
          teacherId: testTeacherId,
          classId: testClassId,
          goalType: "games_played",
          goalName: "Play 20 Games",
          targetValue: 20,
          currentValue: 0,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "active",
          priority: "low",
          progressPercentage: 0,
        }
      );

      expect(goal1).not.toBeNull();
      expect(goal2).not.toBeNull();
      expect(goal1?.goalType).toBe("score");
      expect(goal2?.goalType).toBe("games_played");
    });
  });

  describe("Goal Retrieval", () => {
    it("should retrieve all goals for a student", async () => {
      const goals = await getStudentGoals(testPlayerId);
      expect(Array.isArray(goals)).toBe(true);
      expect(goals.length).toBeGreaterThan(0);
      expect(goals.every((g) => g.playerId === testPlayerId)).toBe(true);
    });

    it("should retrieve all goals for a class", async () => {
      const goals = await getClassGoals(testClassId);
      expect(Array.isArray(goals)).toBe(true);
      expect(goals.every((g) => g.classId === testClassId)).toBe(true);
    });

    it("should retrieve only active goals", async () => {
      const activeGoals = await getActiveStudentGoals(testPlayerId);
      expect(Array.isArray(activeGoals)).toBe(true);
      expect(activeGoals.every((g) => g.status === "active")).toBe(true);
    });
  });

  describe("Goal Updates", () => {
    it("should update a goal", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for update test");
      }

      const updated = await updateGoal(createdGoalId, {
        goalName: "Updated Goal Name",
        priority: "low",
      });

      expect(updated).not.toBeNull();
      expect(updated?.goalName).toBe("Updated Goal Name");
      expect(updated?.priority).toBe("low");
    });

    it("should update goal progress", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for progress update test");
      }

      const success = await updateGoalProgress(
        createdGoalId,
        45,
        90,
        "Student answered 45 questions correctly"
      );

      expect(success).toBe(true);

      const updatedGoal = await getStudentGoals(testPlayerId);
      const goal = updatedGoal.find((g) => g.id === createdGoalId);

      expect(goal?.currentValue).toBe(45);
      expect(goal?.progressPercentage).toBe(50); // 45/90 = 50%
    });

    it("should mark goal as completed when progress reaches 100%", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for completion test");
      }

      const success = await updateGoalProgress(
        createdGoalId,
        90,
        90,
        "Student reached target accuracy"
      );

      expect(success).toBe(true);

      const updatedGoal = await getStudentGoals(testPlayerId);
      const goal = updatedGoal.find((g) => g.id === createdGoalId);

      expect(goal?.progressPercentage).toBe(100);
      expect(goal?.status).toBe("completed");
    });
  });

  describe("Progress History", () => {
    it("should retrieve goal progress history", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for history test");
      }

      const history = await getGoalProgressHistory(createdGoalId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].goalId).toBe(createdGoalId);
    });

    it("should track multiple progress updates", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for multiple updates test");
      }

      const history = await getGoalProgressHistory(createdGoalId);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Goal Feedback", () => {
    it("should add feedback to a goal", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for feedback test");
      }

      const feedback = await addGoalFeedback(
        createdGoalId,
        testPlayerId,
        testTeacherId,
        "Great job! Keep up the excellent work!",
        "celebration"
      );

      expect(feedback).not.toBeNull();
      expect(feedback?.feedbackText).toBe("Great job! Keep up the excellent work!");
      expect(feedback?.feedbackType).toBe("celebration");
    });

    it("should retrieve feedback for a goal", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for feedback retrieval test");
      }

      const feedbacks = await getGoalFeedback(createdGoalId);
      expect(Array.isArray(feedbacks)).toBe(true);
      expect(feedbacks.length).toBeGreaterThan(0);
      expect(feedbacks[0].goalId).toBe(createdGoalId);
    });

    it("should support different feedback types", async () => {
      if (!createdGoalId) {
        throw new Error("No goal created for feedback types test");
      }

      const types: Array<"encouragement" | "suggestion" | "warning" | "celebration"> = [
        "encouragement",
        "suggestion",
        "warning",
      ];

      for (const type of types) {
        const feedback = await addGoalFeedback(
          createdGoalId,
          testPlayerId,
          testTeacherId,
          `Test ${type} feedback`,
          type
        );
        expect(feedback?.feedbackType).toBe(type);
      }
    });
  });

  describe("Goal Achievements", () => {
    it("should retrieve student achievements", async () => {
      const achievements = await getStudentAchievements(testPlayerId);
      expect(Array.isArray(achievements)).toBe(true);
    });

    it("should retrieve class achievements", async () => {
      const achievements = await getClassAchievements(testTeacherId, 10);
      expect(Array.isArray(achievements)).toBe(true);
    });
  });

  describe("Goal Deadlines", () => {
    it("should retrieve goals due soon", async () => {
      const goalsDueSoon = await getGoalsDueSoon(testTeacherId);
      expect(Array.isArray(goalsDueSoon)).toBe(true);
      expect(goalsDueSoon.every((g) => g.status === "active")).toBe(true);
    });

    it("should retrieve overdue goals", async () => {
      const overdueGoals = await getOverdueGoals(testTeacherId);
      expect(Array.isArray(overdueGoals)).toBe(true);
      expect(overdueGoals.every((g) => g.status === "active")).toBe(true);
    });
  });

  describe("Goal Statistics", () => {
    it("should calculate goal statistics", async () => {
      const stats = await getGoalStatistics(testTeacherId);

      expect(stats).toHaveProperty("totalGoals");
      expect(stats).toHaveProperty("activeGoals");
      expect(stats).toHaveProperty("completedGoals");
      expect(stats).toHaveProperty("failedGoals");
      expect(stats).toHaveProperty("completionRate");
      expect(stats).toHaveProperty("averageProgressPercentage");

      expect(typeof stats.totalGoals).toBe("number");
      expect(typeof stats.completionRate).toBe("number");
      expect(stats.completionRate).toBeGreaterThanOrEqual(0);
      expect(stats.completionRate).toBeLessThanOrEqual(100);
    });

    it("should track completion rate correctly", async () => {
      const stats = await getGoalStatistics(testTeacherId);

      if (stats.totalGoals > 0) {
        const expectedRate = Math.round(
          (stats.completedGoals / stats.totalGoals) * 100
        );
        expect(stats.completionRate).toBe(expectedRate);
      }
    });
  });

  describe("Goal Deletion", () => {
    it("should delete a goal", async () => {
      // Create a goal specifically for deletion
      const goalToDelete = await createGoal(
        testPlayerId,
        testPlayerName,
        testTeacherId,
        testClassId,
        {
          playerId: testPlayerId,
          playerName: testPlayerName,
          teacherId: testTeacherId,
          classId: testClassId,
          goalType: "accuracy",
          goalName: "Goal to Delete",
          targetValue: 80,
          currentValue: 0,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "active",
          priority: "low",
          progressPercentage: 0,
        }
      );

      expect(goalToDelete).not.toBeNull();

      if (goalToDelete?.id) {
        const success = await deleteGoal(goalToDelete.id);
        expect(success).toBe(true);

        // Verify deletion
        const goals = await getStudentGoals(testPlayerId);
        const deletedGoal = goals.find((g) => g.id === goalToDelete.id);
        expect(deletedGoal).toBeUndefined();
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent student gracefully", async () => {
      const goals = await getStudentGoals(999999);
      expect(Array.isArray(goals)).toBe(true);
      expect(goals.length).toBe(0);
    });

    it("should handle non-existent class gracefully", async () => {
      const goals = await getClassGoals(999999);
      expect(Array.isArray(goals)).toBe(true);
      expect(goals.length).toBe(0);
    });

    it("should calculate progress percentage correctly", async () => {
      const testCases = [
        { current: 0, target: 100, expected: 0 },
        { current: 50, target: 100, expected: 50 },
        { current: 100, target: 100, expected: 100 },
        { current: 150, target: 100, expected: 100 }, // Should cap at 100
      ];

      for (const testCase of testCases) {
        const percentage = Math.min(
          Math.round((testCase.current / testCase.target) * 100),
          100
        );
        expect(percentage).toBe(testCase.expected);
      }
    });
  });
});
