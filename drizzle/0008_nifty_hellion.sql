CREATE TABLE `chatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`mode` enum('general','ideas','resources','trivia','challenges') NOT NULL DEFAULT 'general',
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`mode` enum('general','ideas','resources','trivia','challenges') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
