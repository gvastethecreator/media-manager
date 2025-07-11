import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in the environment variables');
}

export default defineConfig({
	dialect: 'sqlite',
	out: './src/lib/drizzle/migrations',
	schema: './src/lib/drizzle/schema/index.ts',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	verbose: true,
	strict: true,
});
