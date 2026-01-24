CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`goalId` int,
	`entryDate` timestamp NOT NULL DEFAULT (now()),
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`mood` enum('excellent','good','neutral','struggling','discouraged') NOT NULL DEFAULT 'neutral',
	`challengesFaced` text,
	`strategiesUsed` text,
	`lessonsLearned` text,
	`nextSteps` text,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journalInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`insightType` enum('progress_trend','challenge_pattern','strategy_effectiveness','motivation_level','learning_style') NOT NULL DEFAULT 'progress_trend',
	`insight` text NOT NULL,
	`supportingData` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journalInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journalReflectionsSummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`totalEntries` int NOT NULL DEFAULT 0,
	`averageMood` varchar(20) DEFAULT 'neutral',
	`mostCommonChallenge` text,
	`mostEffectiveStrategy` text,
	`lastEntryDate` timestamp,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journalReflectionsSummary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reflectionPrompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('goal_progress','challenges','strategies','learning','motivation') NOT NULL DEFAULT 'goal_progress',
	`prompt` text NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reflectionPrompts_id` PRIMARY KEY(`id`)
);
