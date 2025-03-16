// Exportar todo lo relacionado con Drizzle
export * from './db';
export * from './repository';
export * from './schema';

// Exportar tipos inferidos
import * as schema from './schema';

// Tipos para las tablas
export type Profile = typeof schema.profiles.$inferSelect;
export type ProfileInsert = typeof schema.profiles.$inferInsert;

export type Folder = typeof schema.folders.$inferSelect;
export type FolderInsert = typeof schema.folders.$inferInsert;

export type FolderVisualConfig = typeof schema.folderVisualConfigs.$inferSelect;
export type FolderVisualConfigInsert = typeof schema.folderVisualConfigs.$inferInsert;

export type QueueJob = typeof schema.queueJobs.$inferSelect;
export type QueueJobInsert = typeof schema.queueJobs.$inferInsert;
