CREATE TABLE `feedback_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`total_feedback` int NOT NULL DEFAULT 0,
	`bug_reports` int NOT NULL DEFAULT 0,
	`feature_requests` int NOT NULL DEFAULT 0,
	`usability_issues` int NOT NULL DEFAULT 0,
	`average_rating` int,
	`top_categories` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedback_id` int NOT NULL,
	`admin_id` int,
	`response_text` text NOT NULL,
	`is_public` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`trial_account_id` int,
	`feedback_type` enum('bug','feature_request','usability','performance','other') NOT NULL,
	`category` enum('game','certificates','analytics','ui','mobile','other') NOT NULL,
	`rating` int,
	`title` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`attachment_url` text,
	`status` enum('new','reviewed','in_progress','resolved','wont_fix') NOT NULL DEFAULT 'new',
	`admin_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_feedback_id` PRIMARY KEY(`id`)
);
