CREATE TABLE `adminNotificationPreferences` (
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
	CONSTRAINT `adminNotificationPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adminSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	`type` enum('boolean','string','number','json') NOT NULL,
	`description` text,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`resourceId` varchar(100),
	`changes` json,
	`metadata` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientUserId` int,
	`type` varchar(50) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`externalId` varchar(100),
	`error` text,
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailSends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`enabled` boolean NOT NULL DEFAULT false,
	`owner` varchar(100) NOT NULL,
	`rolloutPercentage` int NOT NULL DEFAULT 0,
	`targetRoles` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`),
	CONSTRAINT `featureFlags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(50) NOT NULL,
	`capability` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(100) NOT NULL,
	`stripeSubscriptionId` varchar(100) NOT NULL,
	`status` enum('trialing','active','incomplete','incomplete_expired','past_due','canceled','unpaid') NOT NULL,
	`priceId` varchar(100) NOT NULL,
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`canceledAt` timestamp,
	`latestInvoiceId` varchar(100),
	`lastPaymentStatus` enum('succeeded','failed','pending'),
	`lastWebhookEventId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripeCustomerId_unique` UNIQUE(`stripeCustomerId`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(100) NOT NULL,
	`type` varchar(100) NOT NULL,
	`status` enum('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
	`payload` json NOT NULL,
	`error` text,
	`attempts` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`nextRetryAt` timestamp,
	`lastAttemptAt` timestamp,
	`succeededAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhookEvents_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
DROP TABLE `notificationPreferences`;--> statement-breakpoint
DROP TABLE `userNotificationPreferences`;