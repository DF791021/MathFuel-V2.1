CREATE TABLE `inviteCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedBy` int,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inviteCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `inviteCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_token_unique` UNIQUE(`token`)
);
