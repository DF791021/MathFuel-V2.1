CREATE TABLE `successStories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`goalId` int NOT NULL,
	`goalName` varchar(255) NOT NULL,
	`goalType` enum('accuracy','score','games_played','streak','topic_mastery') NOT NULL,
	`targetValue` int NOT NULL,
	`achievedValue` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`testimonial` text,
	`tips` text,
	`imageUrl` varchar(500),
	`impactScore` int DEFAULT 0,
	`receivedAlerts` boolean NOT NULL DEFAULT false,
	`alertsCount` int DEFAULT 0,
	`daysToAchieve` int,
	`isPublished` boolean NOT NULL DEFAULT false,
	`isFeature` boolean NOT NULL DEFAULT false,
	`classId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`achievedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successStories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successStoryComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`studentId` int NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`comment` text NOT NULL,
	`isApproved` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `successStoryComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successStoryReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`studentId` int NOT NULL,
	`reactionType` enum('like','inspired','helpful','motivating') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `successStoryReactions_id` PRIMARY KEY(`id`)
);
