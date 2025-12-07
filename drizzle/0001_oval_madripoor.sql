CREATE TABLE `classMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`teacherId` int NOT NULL,
	`joinCode` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_joinCode_unique` UNIQUE(`joinCode`)
);
--> statement-breakpoint
CREATE TABLE `customQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`questionType` enum('question','activity') NOT NULL DEFAULT 'question',
	`question` text NOT NULL,
	`answer` text,
	`createdBy` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`playedAt` timestamp NOT NULL DEFAULT (now()),
	`userId` int,
	CONSTRAINT `gameScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('student','teacher','admin') DEFAULT 'student' NOT NULL;