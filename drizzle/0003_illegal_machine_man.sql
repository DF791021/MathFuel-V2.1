CREATE TABLE `scheduledEmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentName` varchar(100) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`achievementType` varchar(50) NOT NULL,
	`teacherName` varchar(100),
	`schoolName` varchar(200),
	`customMessage` text,
	`emailSubject` text NOT NULL,
	`emailBody` text NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','sent','cancelled','failed') NOT NULL DEFAULT 'pending',
	`teacherId` int NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduledEmails_id` PRIMARY KEY(`id`)
);
