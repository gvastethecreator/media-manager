import type { Config } from 'drizzle-kit';

export default {
	schema: './src/drizzle/schema.ts',
	out: './src/drizzle/migrations',
	driver: 'better-sqlite',
	dbCredentials: {
		url: './prisma/dev.db',
	},
	verbose: true,
	strict: true,
} satisfies Config;
