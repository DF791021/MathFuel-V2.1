CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('student','teacher','admin') NOT NULL,
	`type` enum('challenge_completed','achievement_earned','task_assigned','task_due_soon','feedback_posted','level_up','streak_milestone','student_completed_task','student_needs_help','new_student_joined','account_change','system_alert') NOT NULL,
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
CREATE TABLE `userNotificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inAppAchievements` boolean NOT NULL DEFAULT true,
	`inAppTasks` boolean NOT NULL DEFAULT true,
	`inAppFeedback` boolean NOT NULL DEFAULT true,
	`inAppStreaks` boolean NOT NULL DEFAULT true,
	`inAppSystemAlerts` boolean NOT NULL DEFAULT true,
	`emailAchievements` boolean NOT NULL DEFAULT false,
	`emailTasks` boolean NOT NULL DEFAULT true,
	`emailFeedback` boolean NOT NULL DEFAULT true,
	`emailStreaks` boolean NOT NULL DEFAULT false,
	`emailSystemAlerts` boolean NOT NULL DEFAULT true,
	`emailDigestFrequency` enum('none','daily','weekly') NOT NULL DEFAULT 'weekly',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userNotificationPreferences_userId_unique` UNIQUE(`userId`)
);
