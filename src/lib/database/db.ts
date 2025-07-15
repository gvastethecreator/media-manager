import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Configurar URL de base de datos con soporte para Tauri
const getDatabaseUrl = () => {
	const envUrl = process.env.DATABASE_URL;

	if (envUrl) {
		return envUrl;
	}

	// Fallback por defecto
	const defaultUrl = 'file:./db.sqlite';

	console.log('🔧 [Database] Usando URL por defecto:', defaultUrl);
	return defaultUrl;
};

const databaseUrl = getDatabaseUrl();

console.log('🗃️ [Database] Configuración:', {
	url: databaseUrl,
	hasAuthToken: !!process.env.DATABASE_AUTH_TOKEN,
	nodeEnv: process.env.NODE_ENV,
	tauriEnv: process.env.TAURI_ENV,
});

const client = createClient({
	url: databaseUrl,
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
