CREATE TABLE `exportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`classId` int NOT NULL,
	`exportType` varchar(50) NOT NULL DEFAULT 'success_stories',
	`storyCount` int NOT NULL,
	`dateRange` json,
	`options` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exportHistory_id` PRIMARY KEY(`id`)
);
