CREATE TABLE `goalAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`goalName` varchar(200) NOT NULL,
	`achievedDate` timestamp NOT NULL,
	`daysToComplete` int,
	`rewardPoints` int NOT NULL DEFAULT 10,
	`celebrationMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`playerId` int NOT NULL,
	`teacherId` int NOT NULL,
	`feedbackText` text NOT NULL,
	`feedbackType` enum('encouragement','suggestion','warning','celebration') NOT NULL DEFAULT 'encouragement',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goalProgressHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`playerId` int NOT NULL,
	`previousValue` int NOT NULL,
	`currentValue` int NOT NULL,
	`progressPercentage` int NOT NULL,
	`updateReason` varchar(200),
	`recordedDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `goalProgressHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentPerformanceGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`classId` int NOT NULL,
	`goalType` enum('accuracy','score','games_played','streak','topic_mastery') NOT NULL,
	`goalName` varchar(200) NOT NULL,
	`goalDescription` text,
	`targetValue` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`startDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`status` enum('active','completed','failed','paused') NOT NULL DEFAULT 'active',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`progressPercentage` int NOT NULL DEFAULT 0,
	`completedDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentPerformanceGoals_id` PRIMARY KEY(`id`)
);
