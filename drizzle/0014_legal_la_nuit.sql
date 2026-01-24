CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`goalId` int NOT NULL,
	`goalName` varchar(255) NOT NULL,
	`daysUntilDeadline` int NOT NULL,
	`emailSent` boolean NOT NULL DEFAULT false,
	`emailAddress` varchar(320),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('sent','bounced','failed','opened') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`enableDeadlineAlerts` boolean NOT NULL DEFAULT true,
	`defaultReminderDays` int NOT NULL DEFAULT 3,
	`alertFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'immediate',
	`preferredAlertTime` varchar(5) DEFAULT '09:00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `alertPreferences_playerId_unique` UNIQUE(`playerId`)
);
--> statement-breakpoint
CREATE TABLE `goalDeadlineAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`goalId` int NOT NULL,
	`reminderDaysBefore` int NOT NULL DEFAULT 3,
	`alertStatus` enum('pending','sent','dismissed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`dismissedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goalDeadlineAlerts_id` PRIMARY KEY(`id`)
);
