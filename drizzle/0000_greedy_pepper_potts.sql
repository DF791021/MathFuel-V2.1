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
CREATE TABLE `mathDomains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`displayOrder` int NOT NULL DEFAULT 0,
	`gradeLevel` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mathDomains_id` PRIMARY KEY(`id`),
	CONSTRAINT `mathDomains_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `mathProblems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skillId` int NOT NULL,
	`problemType` enum('multiple_choice','numeric_input','true_false','fill_blank','comparison','word_problem','ordering') NOT NULL,
	`difficulty` int NOT NULL DEFAULT 1,
	`questionText` text NOT NULL,
	`questionImage` varchar(500),
	`correctAnswer` varchar(200) NOT NULL,
	`answerType` enum('number','text','boolean','choice') NOT NULL,
	`choices` json,
	`explanation` text NOT NULL,
	`hintSteps` json NOT NULL,
	`tags` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`timesServed` int NOT NULL DEFAULT 0,
	`timesCorrect` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mathProblems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mathSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domainId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`gradeLevel` int NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`prerequisiteSkillId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mathSkills_id` PRIMARY KEY(`id`),
	CONSTRAINT `mathSkills_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin') NOT NULL,
	`type` enum('payment_received','payment_failed','subscription_change','new_signup','system_alert','content_update') NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`linkUrl` varchar(500),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	`dismissedAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parentStudentLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentId` int NOT NULL,
	`studentId` int NOT NULL,
	`relationship` varchar(50) NOT NULL DEFAULT 'parent',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parentStudentLinks_id` PRIMARY KEY(`id`)
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
CREATE TABLE `practiceSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`sessionType` enum('daily','practice','review','assessment') NOT NULL DEFAULT 'daily',
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`totalProblems` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`hintsUsed` int NOT NULL DEFAULT 0,
	`totalTimeSeconds` int NOT NULL DEFAULT 0,
	`averageDifficulty` int NOT NULL DEFAULT 1,
	`skillsFocused` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practiceSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `problemAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`studentId` int NOT NULL,
	`problemId` int NOT NULL,
	`skillId` int NOT NULL,
	`studentAnswer` varchar(200),
	`isCorrect` boolean NOT NULL,
	`isFirstTry` boolean NOT NULL DEFAULT true,
	`hintsViewed` int NOT NULL DEFAULT 0,
	`timeSpentSeconds` int NOT NULL DEFAULT 0,
	`difficulty` int NOT NULL,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `problemAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`badgeType` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentDailyStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`sessionsCompleted` int NOT NULL DEFAULT 0,
	`problemsAttempted` int NOT NULL DEFAULT 0,
	`problemsCorrect` int NOT NULL DEFAULT 0,
	`hintsUsed` int NOT NULL DEFAULT 0,
	`totalTimeSeconds` int NOT NULL DEFAULT 0,
	`skillsImproved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentDailyStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentSkillMastery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`skillId` int NOT NULL,
	`masteryLevel` enum('not_started','practicing','close','mastered') NOT NULL DEFAULT 'not_started',
	`masteryScore` int NOT NULL DEFAULT 0,
	`totalAttempts` int NOT NULL DEFAULT 0,
	`correctAttempts` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`bestStreak` int NOT NULL DEFAULT 0,
	`averageTimeSeconds` int NOT NULL DEFAULT 0,
	`lastPracticedAt` timestamp,
	`masteredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentSkillMastery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentStreaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`totalActiveDays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentStreaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `studentStreaks_studentId_unique` UNIQUE(`studentId`)
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`userType` enum('student','parent','teacher','admin') NOT NULL DEFAULT 'student',
	`avatarUrl` varchar(500),
	`gradeLevel` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
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
