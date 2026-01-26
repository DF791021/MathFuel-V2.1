CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`type` enum('feedback','trial','payment','system') NOT NULL,
	`subType` varchar(50),
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`relatedEntityId` int,
	`relatedEntityType` varchar(50),
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
	`emailSent` boolean NOT NULL DEFAULT false,
	`inAppShown` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`frequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'immediate',
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`dashboardEnabled` boolean NOT NULL DEFAULT true,
	`feedbackEnabled` boolean NOT NULL DEFAULT true,
	`lowRatingsEnabled` boolean NOT NULL DEFAULT true,
	`bugsEnabled` boolean NOT NULL DEFAULT true,
	`trialEventsEnabled` boolean NOT NULL DEFAULT true,
	`paymentEventsEnabled` boolean NOT NULL DEFAULT false,
	`digestTime` varchar(5),
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`quietHoursEnabled` boolean NOT NULL DEFAULT false,
	`lastTestSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`)
);
