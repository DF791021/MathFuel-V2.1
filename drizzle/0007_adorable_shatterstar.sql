CREATE TABLE `sharedTemplateLibrary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`tags` varchar(255),
	`isPublic` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`rating` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sharedTemplateLibrary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalTemplateId` int NOT NULL,
	`importedByTeacherId` int NOT NULL,
	`newTemplateId` int,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateImports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`ownerId` int NOT NULL,
	`sharedWithId` int NOT NULL,
	`shareCode` varchar(20) NOT NULL,
	`permission` enum('view','edit','admin') NOT NULL DEFAULT 'view',
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templateShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `templateShares_shareCode_unique` UNIQUE(`shareCode`)
);
