CREATE TABLE `trialAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trialRequestId` int NOT NULL,
	`schoolCode` varchar(20) NOT NULL,
	`adminUserId` int,
	`adminEmail` varchar(320) NOT NULL,
	`adminPassword` varchar(255) NOT NULL,
	`trialStartDate` timestamp NOT NULL DEFAULT (now()),
	`trialEndDate` timestamp NOT NULL,
	`trialDays` int NOT NULL DEFAULT 30,
	`status` enum('active','expired','converted','cancelled') NOT NULL DEFAULT 'active',
	`classesCreated` int NOT NULL DEFAULT 0,
	`studentsAdded` int NOT NULL DEFAULT 0,
	`gamesPlayed` int NOT NULL DEFAULT 0,
	`certificatesGenerated` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trialAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `trialAccounts_schoolCode_unique` UNIQUE(`schoolCode`)
);
--> statement-breakpoint
CREATE TABLE `trialFollowUps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trialAccountId` int NOT NULL,
	`emailType` enum('welcome','day_3_check_in','day_7_engagement','day_14_features','day_28_conversion','expired_offer') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`opened` boolean NOT NULL DEFAULT false,
	`clicked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trialFollowUps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trialMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trialAccountId` int NOT NULL,
	`date` date NOT NULL,
	`activeUsers` int NOT NULL DEFAULT 0,
	`gamesPlayed` int NOT NULL DEFAULT 0,
	`certificatesGenerated` int NOT NULL DEFAULT 0,
	`emailsSent` int NOT NULL DEFAULT 0,
	`pdfExportsGenerated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trialMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trialRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`district` varchar(255),
	`state` varchar(2) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`role` enum('principal','teacher','nutrition_coordinator','it_director','superintendent','other') NOT NULL,
	`studentCount` int,
	`teacherCount` int,
	`message` text,
	`status` enum('pending','approved','trial_created','completed','rejected') NOT NULL DEFAULT 'pending',
	`trialAccountId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trialRequests_id` PRIMARY KEY(`id`)
);
