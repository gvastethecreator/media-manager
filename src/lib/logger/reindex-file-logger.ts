/**
 * @file Logger específico para errores y warnings del sistema de reindexado
 * @module lib/logger/reindex-file-logger
 * @description Sistema de logging que escribe errores y warnings a archivos separados
 */

import fs from 'fs';
import path from 'path';
import { serverLogger } from './server-logger';
import { sanitizeSensitiveLogOutput, sanitizeSensitiveLogText } from '@/lib/security/sanitize-sensitive-output';
import { resolveReindexLogDirectory } from './log-directory';

export interface ReindexLogEntry {
	context?: any;
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
	folderId?: string;
	folderPath?: string;
	level: 'ERROR' | 'WARN';
	message: string;
	operationId?: string;
	source: 'circuit-breaker' | 'auto-indexing' | 'folder-stats' | 'monitor' | 'operation-queue' | 'file-browser';
	timestamp: string;
}

/**
 * File logger específico para el sistema de reindexado
 */
export class ReindexFileLogger {
	private readonly baseDir: string;
	private currentDate!: string;
	private errorLogPath!: string;
	private warningLogPath!: string;

	constructor(baseDir = resolveReindexLogDirectory()) {
		this.baseDir = path.resolve(baseDir);
		this.updateLogPaths();
		this.ensureLogDirectory();
	}

	/**
	 * Actualiza las rutas de los archivos de log basándose en la fecha actual
	 */
	private updateLogPaths(): void {
		this.currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		this.errorLogPath = path.join(this.baseDir, `reindex-errors-${this.currentDate}.log`);
		this.warningLogPath = path.join(this.baseDir, `reindex-warnings-${this.currentDate}.log`);
	}

	/**
	 * Asegura que el directorio de logs existe
	 */
	private ensureLogDirectory(): void {
		try {
			if (!fs.existsSync(this.baseDir)) {
				fs.mkdirSync(this.baseDir, { recursive: true });
				serverLogger.info(`📁 Directorio de logs de reindexado creado: ${this.baseDir}`);
			}
		} catch (error) {
			serverLogger.error('❌ Could not create reindex log directory:', error);
		}
	}

	/**
	 * Verifica si necesita rotar los archivos de log (cambio de día)
	 */
	private checkLogRotation(): void {
		const newDate = new Date().toISOString().split('T')[0];
		if (newDate !== this.currentDate) {
			this.updateLogPaths();
			serverLogger.info(`🔄 Rotación de logs de reindexado: nueva fecha ${newDate}`);
		}
	}

	/**
	 * Escribe una entrada de log al archivo apropiado
	 */
	private writeLogEntry(entry: ReindexLogEntry): void {
		this.checkLogRotation();

		const logLine = this.formatLogEntry(entry);
		const filePath = entry.level === 'ERROR' ? this.errorLogPath : this.warningLogPath;

		try {
			fs.appendFileSync(filePath, `${logLine}\n`, 'utf8');
		} catch (error) {
			// Fallback a console si no se puede escribir al archivo
			serverLogger.error('❌ Could not write reindex log:', error);
			console.error('[REINDEX-LOG-FALLBACK]', logLine);
		}
	}

	/**
	 * Formatea una entrada de log como JSON estructurado
	 */
	private formatLogEntry(entry: ReindexLogEntry): string {
		const sanitizedEntry = this.sanitizeLogEntry(entry);
		try {
			return JSON.stringify(sanitizedEntry);
		} catch (error) {
			// Fallback a formato simple si hay problemas con JSON
			return `${sanitizedEntry.timestamp} [${sanitizedEntry.level}] ${sanitizedEntry.source}: ${sanitizeSensitiveLogText(sanitizedEntry.message)}`;
		}
	}

	private sanitizeLogEntry(entry: ReindexLogEntry): ReindexLogEntry {
		return sanitizeSensitiveLogOutput(entry) as ReindexLogEntry;
	}

	/**
	 * Crea una entrada de log con timestamp y metadatos
	 */
	private createLogEntry(
		level: 'ERROR' | 'WARN',
		source: ReindexLogEntry['source'],
		message: string,
		options: Partial<Omit<ReindexLogEntry, 'timestamp' | 'level' | 'source' | 'message'>> = {}
	): ReindexLogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			source,
			message,
			...options,
		};
	}

	/**
	 * Registra un error
	 */
	logError(
		source: ReindexLogEntry['source'],
		message: string,
		options: {
			operationId?: string;
			folderId?: string;
			folderPath?: string;
			context?: any;
			error?: Error;
		} = {}
	): void {
		const entry = this.createLogEntry('ERROR', source, message, {
			...options,
			error: options.error
				? {
						name: options.error.name,
						message: options.error.message,
						stack: options.error.stack,
					}
				: undefined,
		});

		this.writeLogEntry(entry);

		// También logueamos a console para debugging inmediato
		serverLogger.error(`[${source.toUpperCase()}] ${message}`, options.context);
	}

	/**
	 * Registra un warning
	 */
	logWarning(
		source: ReindexLogEntry['source'],
		message: string,
		options: {
			operationId?: string;
			folderId?: string;
			folderPath?: string;
			context?: any;
		} = {}
	): void {
		const entry = this.createLogEntry('WARN', source, message, options);

		this.writeLogEntry(entry);

		// También logueamos a console para debugging inmediato
		serverLogger.warn(`[${source.toUpperCase()}] ${message}`, options.context);
	}

	/**
	 * Obtiene estadísticas de los archivos de log
	 */
	getLogStats(): {
		errorLogPath: string;
		warningLogPath: string;
		errorLogSize: number;
		warningLogSize: number;
		errorLogExists: boolean;
		warningLogExists: boolean;
	} {
		this.checkLogRotation();

		const getFileSize = (filePath: string): number => {
			try {
				const stats = fs.statSync(filePath);
				return stats.size;
			} catch {
				return 0;
			}
		};

		return {
			errorLogPath: this.errorLogPath,
			warningLogPath: this.warningLogPath,
			errorLogSize: getFileSize(this.errorLogPath),
			warningLogSize: getFileSize(this.warningLogPath),
			errorLogExists: fs.existsSync(this.errorLogPath),
			warningLogExists: fs.existsSync(this.warningLogPath),
		};
	}

	getPublicLogStats(): Omit<ReturnType<ReindexFileLogger['getLogStats']>, 'errorLogPath' | 'warningLogPath'> {
		const { errorLogPath: _errorLogPath, warningLogPath: _warningLogPath, ...publicStats } = this.getLogStats();
		return publicStats;
	}

	/**
	 * Lee las últimas entradas de un archivo de log
	 */
	readRecentLogs(type: 'error' | 'warning', maxLines = 100): ReindexLogEntry[] {
		this.checkLogRotation();

		const filePath = type === 'error' ? this.errorLogPath : this.warningLogPath;

		try {
			if (!fs.existsSync(filePath)) {
				return [];
			}

			const content = fs.readFileSync(filePath, 'utf8');
			const lines = content
				.trim()
				.split('\n')
				.filter((line) => line.trim());

			// Tomar las últimas líneas
			const recentLines = lines.slice(-maxLines);

			return recentLines.map((line) => {
				try {
					return this.sanitizeLogEntry(JSON.parse(line) as ReindexLogEntry);
				} catch {
					// Si no se puede parsear como JSON, crear entrada básica
					return this.sanitizeLogEntry({
						timestamp: new Date().toISOString(),
						level: type === 'error' ? 'ERROR' : 'WARN',
						source: 'unknown' as any,
						message: sanitizeSensitiveLogText(line),
					});
				}
			});
		} catch (error) {
			serverLogger.error(`Could not read reindex logs (${type}):`, error);
			return [];
		}
	}

	/**
	 * Limpia archivos de log antiguos (más de 30 días)
	 */
	cleanupOldLogs(): void {
		try {
			if (!fs.existsSync(this.baseDir)) {
				return;
			}

			const files = fs.readdirSync(this.baseDir);
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			let deletedCount = 0;

			for (const file of files) {
				if (file.startsWith('reindex-') && file.endsWith('.log')) {
					const filePath = path.join(this.baseDir, file);
					const stats = fs.statSync(filePath);

					if (stats.mtime < thirtyDaysAgo) {
						fs.unlinkSync(filePath);
						deletedCount++;
					}
				}
			}

			if (deletedCount > 0) {
				serverLogger.info(`🧹 Limpieza de logs antiguos: ${deletedCount} archivos eliminados`);
			}
		} catch (error) {
			serverLogger.error('❌ Error en limpieza de logs antiguos:', error);
		}
	}

	/**
	 * Obtiene resumen de errores por fuente
	 */
	async getErrorSummary(days = 7): Promise<Record<string, number>> {
		const summary: Record<string, number> = {};
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		try {
			if (!fs.existsSync(this.baseDir)) {
				return summary;
			}

			const files = fs.readdirSync(this.baseDir);

			for (const file of files) {
				if (file.startsWith('reindex-errors-') && file.endsWith('.log')) {
					const filePath = path.join(this.baseDir, file);
					const stats = fs.statSync(filePath);

					if (stats.mtime >= startDate) {
						const content = fs.readFileSync(filePath, 'utf8');
						const lines = content
							.trim()
							.split('\n')
							.filter((line) => line.trim());

						for (const line of lines) {
							try {
								const entry = JSON.parse(line) as ReindexLogEntry;
								summary[entry.source] = (summary[entry.source] || 0) + 1;
							} catch {
								// Ignorar líneas que no se pueden parsear
							}
						}
					}
				}
			}
		} catch (error) {
			serverLogger.error('Error obteniendo resumen de errores:', error);
		}

		return summary;
	}
}

// Instancia singleton del file logger
export const reindexFileLogger = new ReindexFileLogger();

// Función helper para crear loggers específicos por fuente
export function createSourceLogger(source: ReindexLogEntry['source']) {
	return {
		logError: (message: string, options?: Parameters<ReindexFileLogger['logError']>[2]) => {
			reindexFileLogger.logError(source, message, options);
		},
		logWarning: (message: string, options?: Parameters<ReindexFileLogger['logWarning']>[2]) => {
			reindexFileLogger.logWarning(source, message, options);
		},
	};
}

// Exportar loggers específicos por fuente
export const circuitBreakerLogger = createSourceLogger('circuit-breaker');
export const autoIndexingLogger = createSourceLogger('auto-indexing');
export const folderStatsLogger = createSourceLogger('folder-stats');
export const monitorLogger = createSourceLogger('monitor');
export const operationQueueLogger = createSourceLogger('operation-queue');
export const fileBrowserLogger = createSourceLogger('file-browser');
