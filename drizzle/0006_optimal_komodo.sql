CREATE TABLE `zipEmailHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`certificateCount` int NOT NULL,
	`studentNames` text NOT NULL,
	`zipFileName` varchar(255) NOT NULL,
	`zipFileSize` int NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `zipEmailHistory_id` PRIMARY KEY(`id`)
);
