CREATE TABLE `homePracticeAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`studentId` int NOT NULL,
	`classId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`problemCount` int NOT NULL DEFAULT 5,
	`difficulty` enum('easy','medium','hard','adaptive') NOT NULL DEFAULT 'adaptive',
	`dueDate` timestamp,
	`assignedDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','completed','overdue','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homePracticeAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homePracticeProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`studentId` int NOT NULL,
	`problemsAttempted` int NOT NULL DEFAULT 0,
	`problemsCorrect` int NOT NULL DEFAULT 0,
	`accuracyPercentage` int NOT NULL DEFAULT 0,
	`timeSpentMinutes` int NOT NULL DEFAULT 0,
	`completionPercentage` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`lastAttemptAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homePracticeProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parentAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`preferredLanguage` varchar(10) NOT NULL DEFAULT 'en',
	`notificationPreference` enum('email','sms','both','none') NOT NULL DEFAULT 'email',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parentAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `parentAccounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `parentProgressReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`parentId` int NOT NULL,
	`reportPeriod` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`totalProblemsAttempted` int NOT NULL DEFAULT 0,
	`totalProblemsCorrect` int NOT NULL DEFAULT 0,
	`averageAccuracy` int NOT NULL DEFAULT 0,
	`topicsMastered` text,
	`topicsNeedingWork` text,
	`recommendedPracticeAreas` text,
	`summaryNotes` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`viewedAt` timestamp,
	CONSTRAINT `parentProgressReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parentTeacherMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`studentId` int NOT NULL,
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`messageType` enum('general','progress_update','concern','celebration','question') NOT NULL DEFAULT 'general',
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`attachmentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parentTeacherMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`achievementType` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`badgeIcon` varchar(500),
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`notifiedAt` timestamp,
	CONSTRAINT `studentAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentParentLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`parentId` int NOT NULL,
	`relationship` varchar(50) NOT NULL,
	`accessLevel` enum('view_only','view_and_comment','full_access') NOT NULL DEFAULT 'view_only',
	`linkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentParentLinks_id` PRIMARY KEY(`id`)
);
