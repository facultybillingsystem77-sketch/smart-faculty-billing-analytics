CREATE TABLE `billing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`faculty_id` integer NOT NULL,
	`month` text NOT NULL,
	`base_salary` real NOT NULL,
	`allowances` real NOT NULL,
	`deductions` real NOT NULL,
	`net_salary` real NOT NULL,
	`workload` text NOT NULL,
	`status` text NOT NULL,
	`generated_at` text NOT NULL,
	`paid_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `faculty` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`employee_id` text NOT NULL,
	`department` text NOT NULL,
	`designation` text NOT NULL,
	`joining_date` text NOT NULL,
	`base_salary` real NOT NULL,
	`phone` text,
	`address` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faculty_employee_id_unique` ON `faculty` (`employee_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);