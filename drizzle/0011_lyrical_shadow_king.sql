CREATE TABLE `gameAnalyticsClassImprovement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`className` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`classAccuracyChange` int DEFAULT 0,
	`classScoreChange` int DEFAULT 0,
	`participationChange` int DEFAULT 0,
	`improvingStudentCount` int NOT NULL DEFAULT 0,
	`stableStudentCount` int NOT NULL DEFAULT 0,
	`decliningStudentCount` int NOT NULL DEFAULT 0,
	`previousClassAccuracy` int NOT NULL DEFAULT 0,
	`currentClassAccuracy` int NOT NULL DEFAULT 0,
	`previousAverageScore` int NOT NULL DEFAULT 0,
	`currentAverageScore` int NOT NULL DEFAULT 0,
	`periodStartDate` timestamp NOT NULL,
	`periodEndDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsClassImprovement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsHistoricalSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`totalGamesPlayed` int NOT NULL DEFAULT 0,
	`accuracyRate` int NOT NULL DEFAULT 0,
	`averageScore` int NOT NULL DEFAULT 0,
	`totalCorrectAnswers` int NOT NULL DEFAULT 0,
	`totalAnswers` int NOT NULL DEFAULT 0,
	`streakCount` int NOT NULL DEFAULT 0,
	`averageTimePerGame` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameAnalyticsHistoricalSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsPerformanceMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`milestoneType` enum('first_game','accuracy_90','accuracy_95','accuracy_100','games_10','games_25','games_50','games_100','streak_5','streak_10','streak_20','top_performer','most_improved','consistent_performer') NOT NULL,
	`milestoneDescription` varchar(200) NOT NULL,
	`achievedDate` timestamp NOT NULL DEFAULT (now()),
	`rewardPoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameAnalyticsPerformanceMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsRankingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`recordDate` timestamp NOT NULL,
	`currentRank` int NOT NULL,
	`previousRank` int,
	`rankChange` int DEFAULT 0,
	`totalScore` int NOT NULL,
	`accuracyRate` int NOT NULL,
	`gamesPlayed` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameAnalyticsRankingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameAnalyticsStudentImprovement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`accuracyChange` int DEFAULT 0,
	`scoreChange` int DEFAULT 0,
	`gamesPlayedChange` int DEFAULT 0,
	`improvementTrend` enum('improving','stable','declining') NOT NULL DEFAULT 'stable',
	`improvementPercentage` int NOT NULL DEFAULT 0,
	`previousAccuracy` int NOT NULL DEFAULT 0,
	`currentAccuracy` int NOT NULL DEFAULT 0,
	`previousScore` int NOT NULL DEFAULT 0,
	`currentScore` int NOT NULL DEFAULT 0,
	`periodStartDate` timestamp NOT NULL,
	`periodEndDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameAnalyticsStudentImprovement_id` PRIMARY KEY(`id`)
);
