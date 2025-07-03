import { type Prisma, PrismaClient } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';

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

class Database {
	private static instance: Database;
	private client: PrismaClient;
	private config: Required<DatabaseConfig>;
	private isInitialized = false;
	private isInitializing = false;
	private connectionPromise?: Promise<void>;
	private lastError?: Error;

	private constructor(config: DatabaseConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Configurar cliente Prisma
		this.client = new PrismaClient({
			log: [
				{ level: 'error', emit: 'event' },
				{ level: 'warn', emit: 'event' },
				{ level: 'info', emit: 'event' },
				{ level: 'query', emit: 'event' },
			],
			errorFormat: 'pretty',
			datasources: {
				db: {
					url: process.env.DATABASE_URL,
				},
			},
		});

		// Configurar eventos de logging
		this.client.$on('error', (e: Prisma.LogEvent) => {
			this.lastError = e instanceof Error ? e : new Error(String(e));
			serverLogger.error('Error de base de datos:', e);
		});

		this.client.$on('warn', (e: Prisma.LogEvent) => {
			serverLogger.warn('Advertencia de base de datos:', e);
		});

		this.client.$on('info', (e: Prisma.LogEvent) => {
			serverLogger.info('Info de base de datos:', e);
		});

		this.client.$on('query', (e: Prisma.QueryEvent) => {
			serverLogger.debug('Query ejecutada:', {
				query: e.query,
				params: e.params,
				duration: e.duration,
			});
		});
	}

	/**
	 * Obtiene la instancia única de la base de datos
	 */
	public static getInstance(config?: DatabaseConfig): Database {
		if (!Database.instance) {
			Database.instance = new Database(config);
		}
		return Database.instance;
	}

	/**
	 * Inicializa la conexión a la base de datos
	 */
	public async initialize(): Promise<void> {
		if (this.isInitialized) {
			serverLogger.debug('La base de datos ya está inicializada');
			return;
		}

		if (this.isInitializing) {
			serverLogger.debug('La base de datos está en proceso de inicialización');
			return this.connectionPromise;
		}

		this.isInitializing = true;
		this.connectionPromise = this.connect();

		try {
			await this.connectionPromise;
		} finally {
			this.isInitializing = false;
		}

		return this.connectionPromise;
	}

	/**
	 * Establece la conexión con la base de datos
	 */
	private async connect(): Promise<void> {
		let attempts = 0;

		while (attempts < this.config.retryAttempts) {
			try {
				serverLogger.info('Conectando a la base de datos...');

				// Intentar conectar
				await this.client.$connect();

				// Verificar conexión
				await this.client.folder.count();

				this.isInitialized = true;
				this.lastError = undefined;
				serverLogger.info('Conexión establecida correctamente');
				return;
			} catch (error) {
				attempts++;
				this.lastError = error instanceof Error ? error : new Error(String(error));
				serverLogger.error(`Error al conectar (intento ${attempts}/${this.config.retryAttempts}):`, {
					error: this.lastError.message,
				});

				if (attempts === this.config.retryAttempts) {
					throw new Error('No se pudo establecer conexión con la base de datos');
				}

				// Esperar antes de reintentar
				await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
			}
		}
	}

	/**
	 * Cierra la conexión con la base de datos
	 */
	public async disconnect(): Promise<void> {
		if (!this.isInitialized) {
			return;
		}

		try {
			await this.client.$disconnect();
			this.isInitialized = false;
			serverLogger.info('Conexión cerrada correctamente');
		} catch (error) {
			serverLogger.error('Error al cerrar conexión:', error);
			throw error;
		}
	}

	/**
	 * Obtiene el cliente de Prisma
	 */
	public getClient(): PrismaClient {
		if (!this.isInitialized) {
			throw new Error('La base de datos no está inicializada');
		}
		return this.client;
	}

	/**
	 * Verifica si la base de datos está conectada
	 */
	public isConnected(): boolean {
		return this.isInitialized;
	}

	/**
	 * Verifica si la base de datos está en proceso de inicialización
	 */
	public isConnecting(): boolean {
		return this.isInitializing;
	}

	/**
	 * Obtiene el último error registrado
	 */
	public getLastError(): Error | undefined {
		return this.lastError;
	}
}

// Exportar instancia única
export const db = Database.getInstance();

// Exportar función para obtener el cliente de forma segura
export async function getPrismaClient(): Promise<PrismaClient> {
	if (!db.isConnected()) {
		await db.initialize();
	}
	return db.getClient();
}

/**
 * Inicializa la base de datos con la configuración proporcionada
 */
export async function initializeDatabase(_config?: DatabaseConfig): Promise<void> {
	try {
		await db.initialize();
	} catch (error) {
		serverLogger.error('Error al inicializar la base de datos:', error);
		throw error;
	}
}

/**
 * Obtiene el estado actual de la conexión a la base de datos
 */
export async function getDatabaseStatus() {
	try {
		// Si la base de datos está en proceso de inicialización
		if (db.isConnecting()) {
			return {
				status: 'initializing',
				message: 'Base de datos inicializándose',
			};
		}

		// Si la base de datos no está conectada, intentar inicializar
		if (!db.isConnected()) {
			try {
				await db.initialize();
			} catch (error) {
				return {
					status: 'error',
					message: error instanceof Error ? error.message : 'Error al inicializar la base de datos',
				};
			}
		}

		// Verificar conexión
		const client = db.getClient();
		const result = await client.$queryRaw`SELECT 1+1 as test`;

		// Definir un tipo para el resultado de la consulta
		type TestResult = {
			test: number | bigint;
		};
		const firstResult = (result as TestResult[])?.[0];

		if (firstResult && firstResult.test === 2) {
			return {
				status: 'connected',
				message: 'Conexión a la base de datos exitosa',
			};
		}
		return {
			status: 'error',
			message: 'La consulta de prueba a la base de datos falló',
		};
	} catch (error) {
		const lastError = db.getLastError();
		return {
			status: 'error',
			message: lastError?.message || (error instanceof Error ? error.message : 'Error desconocido'),
		};
	}
}
