CREATE TABLE `rouletteChallengeTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(20),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteChallengeTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rouletteChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`typeId` int NOT NULL,
	`teacherId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`correctAnswer` text,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`pointsReward` int NOT NULL DEFAULT 100,
	`timeLimit` int NOT NULL DEFAULT 30,
	`isCustom` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rouletteGamePlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int,
	`playerName` varchar(100) NOT NULL,
	`totalScore` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`totalAnswers` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteGamePlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rouletteGameSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`sessionCode` varchar(10) NOT NULL,
	`gameStatus` enum('waiting','active','paused','completed') NOT NULL DEFAULT 'waiting',
	`currentRound` int NOT NULL DEFAULT 0,
	`totalRounds` int NOT NULL DEFAULT 5,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`endedAt` timestamp,
	CONSTRAINT `rouletteGameSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `rouletteGameSessions_sessionCode_unique` UNIQUE(`sessionCode`)
);
--> statement-breakpoint
CREATE TABLE `roulettePlayerPowerUps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`powerUpId` int NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roulettePlayerPowerUps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roulettePowerUps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`effect` varchar(100) NOT NULL,
	`pointsBonus` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roulettePowerUps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rouletteRoundResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`roundNumber` int NOT NULL,
	`challengeId` int NOT NULL,
	`playerId` int NOT NULL,
	`playerAnswer` text,
	`isCorrect` boolean NOT NULL,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`timeSpent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteRoundResults_id` PRIMARY KEY(`id`)
);
