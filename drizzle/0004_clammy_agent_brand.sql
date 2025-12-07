CREATE TABLE `issuedCertificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateId` varchar(32) NOT NULL,
	`studentName` varchar(100) NOT NULL,
	`achievementType` varchar(50) NOT NULL,
	`teacherName` varchar(100),
	`schoolName` varchar(200),
	`customMessage` text,
	`signature` varchar(128) NOT NULL,
	`issuedBy` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`verificationCount` int NOT NULL DEFAULT 0,
	`lastVerifiedAt` timestamp,
	CONSTRAINT `issuedCertificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `issuedCertificates_certificateId_unique` UNIQUE(`certificateId`)
);
