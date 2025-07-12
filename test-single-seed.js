#!/usr/bin/env node

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { seedProfiles } from './src/lib/drizzle/seeds/profiles.seed.js';

const client = createClient({
	url: process.env.DATABASE_URL || 'file:./db.sqlite',
});

const db = drizzle(client);

try {
	console.log('🧪 Probando seed de profiles...');
	await seedProfiles(db);
	console.log('✅ Seed de profiles exitoso');
} catch (error) {
	console.error('❌ Error en seed de profiles:', error);
	console.error('Stack trace:', error.stack);
} finally {
	client.close();
}
