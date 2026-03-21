CREATE TABLE `aiFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`sessionId` int,
	`problemId` int,
	`responseType` enum('hint','explanation','session_summary') NOT NULL,
	`rating` enum('up','down') NOT NULL,
	`aiResponseText` text,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiFeedback_id` PRIMARY KEY(`id`)
);
