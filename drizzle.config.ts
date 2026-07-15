import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/drizzle/schema/index.ts',
	out: './src/lib/drizzle/migrations',
	verbose: true,
	strict: true,
	...(process.env.DATABASE_URL ? { dbCredentials: { url: process.env.DATABASE_URL } } : {}),
});
