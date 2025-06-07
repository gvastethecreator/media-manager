import { z } from 'zod';

export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LoggerConfigSchema = z.object({
	level: LogLevelSchema,
	enableConsole: z.boolean(),
	format: z.object({
		timestamp: z.boolean(),
		colors: z.boolean(),
		context: z.boolean(),
	}),
	services: z.record(
		z.string(),
		z.object({
			level: LogLevelSchema.optional(),
			enabled: z.boolean(),
		})
	),
});

export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;

export const loggerConfig: LoggerConfig = {
	level: 'debug',
	enableConsole: true,
	format: {
		timestamp: true,
		colors: true,
		context: true,
	},
	services: {
		ImageService: {
			enabled: true,
			level: 'info',
		},
		ThumbnailService: {
			enabled: true,
			level: 'info',
		},
		StatsService: {
			enabled: true,
			level: 'info',
		},
		CacheManager: {
			enabled: true,
			level: 'warn',
		},
	},
};
