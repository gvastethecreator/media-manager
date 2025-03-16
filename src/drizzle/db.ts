import { logger } from '@/lib/logger/logger';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Tipos para la configuración de la base de datos
interface DatabaseConfig {
	logLevel?: 'info' | 'warn' | 'error';
	connectionTimeout?: number;
	maxConnections?: number;
	retryAttempts?: number;
	retryDelay?: number;
}

// Configuración por defecto
const DEFAULT_CONFIG: Required<DatabaseConfig> = {
	logLevel: 'error',
	connectionTimeout: 10000,
	maxConnections: 10,
	retryAttempts: 3,
	retryDelay: 1000,
};

class DrizzleDatabase {
	private static instance: DrizzleDatabase;
	private db: ReturnType<typeof drizzle>;
	private sqlite: Database.Database;
	private config: Required<DatabaseConfig>;
	private isInitialized = false;
	private isInitializing = false;
	private connectionPromise?: Promise<void>;
	private lastError?: Error;

	private constructor(config: DatabaseConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Configurar cliente SQLite
		this.sqlite = new Database('./prisma/dev.db', {
			verbose: process.env.NODE_ENV === 'development' ? (message) => logger.debug(`[SQLite]: ${message}`) : undefined,
		});

		// Configurar Drizzle
		this.db = drizzle(this.sqlite, { schema, logger: true });

		// Configurar eventos de logging
		logger.info('🔌 Drizzle Database initialized');
	}

	public static getInstance(config?: DatabaseConfig): DrizzleDatabase {
		if (!DrizzleDatabase.instance) {
			DrizzleDatabase.instance = new DrizzleDatabase(config);
		}
		return DrizzleDatabase.instance;
	}

	public getDb() {
		return this.db;
	}

	public getSqlite() {
		return this.sqlite;
	}

	public async disconnect(): Promise<void> {
		if (this.sqlite) {
			this.sqlite.close();
			logger.info('🔌 Database connection closed');
		}
	}
}

// Exportar instancia singleton
export const drizzleDb = DrizzleDatabase.getInstance();
export const db = drizzleDb.getDb();

// Asegurar que la conexión se cierre al salir
process.on('beforeExit', async () => {
	await drizzleDb.disconnect();
});
