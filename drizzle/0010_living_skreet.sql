CREATE TABLE `gameAnalyticsClassPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`className` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`totalStudents` int NOT NULL DEFAULT 0,
	`totalGamesPlayed` int NOT NULL DEFAULT 0,
	`averageScore` int NOT NULL DEFAULT 0,
	`classAccuracyRate` int NOT NULL DEFAULT 0,
	`highestScore` int NOT NULL DEFAULT 0,
	`lowestScore` int NOT NULL DEFAULT 0,
	`averageTimePerGame` int NOT NULL DEFAULT 0,
	`participationRate` int NOT NULL DEFAULT 0,
	`lastGamePlayedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsClassPerformance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsDailyEngagement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`gamesPlayedCount` int NOT NULL DEFAULT 0,
	`uniquePlayersCount` int NOT NULL DEFAULT 0,
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`averageAccuracy` int NOT NULL DEFAULT 0,
	`totalTimeSpent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsDailyEngagement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsDifficultyProgression` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`totalAttempts` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`accuracyRate` int NOT NULL DEFAULT 0,
	`averageScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsDifficultyProgression_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsQuestionPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`totalAttempts` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`incorrectAnswers` int NOT NULL DEFAULT 0,
	`accuracyRate` int NOT NULL DEFAULT 0,
	`averageTimeSpent` int NOT NULL DEFAULT 0,
	`averagePointsEarned` int NOT NULL DEFAULT 0,
	`lastAskedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsQuestionPerformance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsStudentSummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`totalGamesPlayed` int NOT NULL DEFAULT 1,
	`totalScore` int NOT NULL DEFAULT 0,
	`averageScore` int NOT NULL DEFAULT 0,
	`totalCorrectAnswers` int NOT NULL DEFAULT 0,
	`totalAnswers` int NOT NULL DEFAULT 0,
	`accuracyRate` int NOT NULL DEFAULT 0,
	`bestScore` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`totalTimeSpent` int NOT NULL DEFAULT 0,
	`lastPlayedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsStudentSummary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsTopicMastery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`topic` varchar(100) NOT NULL,
	`totalQuestionsAsked` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`masteryPercentage` int NOT NULL DEFAULT 0,
	`lastPracticedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsTopicMastery_id` PRIMARY KEY(`id`)
);
