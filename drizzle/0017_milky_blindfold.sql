CREATE TABLE `bundleApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleStoryId` int NOT NULL,
	`reviewedBy` int NOT NULL,
	`status` enum('approved','rejected','pending') NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bundleApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundleContributors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleId` int NOT NULL,
	`teacherId` int NOT NULL,
	`role` enum('creator','contributor','viewer') NOT NULL,
	`status` enum('invited','accepted','declined','removed') NOT NULL DEFAULT 'invited',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`joinedAt` timestamp,
	CONSTRAINT `bundleContributors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundleNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleId` int NOT NULL,
	`recipientId` int NOT NULL,
	`notificationType` enum('invitation','story_added','story_approved','story_rejected','bundle_updated','bundle_published') NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedStoryId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bundleNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundleStories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleId` int NOT NULL,
	`storyId` int NOT NULL,
	`addedBy` int NOT NULL,
	`status` enum('pending','approved','rejected','removed') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`rejectionReason` text,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `bundleStories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundleVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`createdBy` int NOT NULL,
	`changeDescription` text,
	`storyCount` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bundleVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collaborativeBundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`schoolName` varchar(255),
	`bundleType` enum('grade_level','school_wide','custom') NOT NULL DEFAULT 'custom',
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`maxContributors` int DEFAULT 10,
	`requiresApproval` boolean NOT NULL DEFAULT true,
	`primaryColor` varchar(7),
	`secondaryColor` varchar(7),
	`organizationMethod` enum('by-class','by-goal','chronological') NOT NULL DEFAULT 'by-class',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collaborativeBundles_id` PRIMARY KEY(`id`)
);
