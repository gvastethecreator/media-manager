CREATE INDEX `Audio_folderId_createdAt_idx` ON `Audio` (`folderId`,`createdAt`,`id`);--> statement-breakpoint
CREATE INDEX `Document_folderId_createdAt_idx` ON `Document` (`folderId`,`createdAt`,`id`);--> statement-breakpoint
CREATE INDEX `File3D_folderId_createdAt_idx` ON `File3D` (`folderId`,`createdAt`,`id`);--> statement-breakpoint
CREATE INDEX `JsonFile_folderId_createdAt_idx` ON `JsonFile` (`folderId`,`createdAt`,`id`);--> statement-breakpoint
CREATE INDEX `Video_folderId_createdAt_idx` ON `Video` (`folderId`,`createdAt`,`id`);