import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express'; // request-logger with requestId
import fs from 'fs';
import path from 'path';
import { type ServerLogger, serverLogger } from '../../lib/logger/server-logger';

/**
 * Interfaz para el logger contextual por-request
 * Incluye los métodos principales de logging con contexto automático
 */
export interface RequestLogger {
	/** Log de nivel debug con contexto de request */
	debug(message: string, context?: unknown): void;
	/** Log de nivel info con contexto de request */
	info(message: string, context?: unknown): void;
	/** Log de nivel warning con contexto de request */
	warn(message: string, context?: unknown): void;
	/** Log de nivel error con contexto de request */
	error(message: string, context?: unknown): void;
	/** Log de nivel success con contexto de request */
	success(message: string, context?: unknown): void;
	/** Log de nivel HTTP con contexto de request */
	http(message: string, context?: unknown): void;
	/** Log de nivel DB con contexto de request */
	db(message: string, context?: unknown): void;
	/** Log de nivel API con contexto de request */
	api(message: string, context?: unknown): void;
	/** Log de nivel system con contexto de request */
	system(message: string, context?: unknown): void;
}

// Configuración de logging
const LOG_TO_FILE = true; // Por defecto habilitado
const LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE !== 'false'; // Por defecto habilitado
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (LOG_TO_FILE && !fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// Archivo de log con timestamp
const logFile = LOG_TO_FILE ? path.join(logsDir, `server-${new Date().toISOString().split('T')[0]}.log`) : null;

// Colores para consola
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
};

// Función para obtener color según status code
function getStatusColor(status: number): string {
	if (status >= 500) {
		return colors.red;
	}
	if (status >= 400) {
		return colors.yellow;
	}
	if (status >= 300) {
		return colors.cyan;
	}
	if (status >= 200) {
		return colors.green;
	}
	return colors.white;
}

// Función para escribir log (SIMPLICADA - sin duplicación)
function writeLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

	// Log a consola con colores (UNA SOLA VEZ)
	if (LOG_TO_CONSOLE) {
		const colorCode = level === 'error' ? colors.red : level === 'warn' ? colors.yellow : colors.cyan;
		const consoleMessage = `${colorCode}🔍 [HTTP-LOG] ${colors.reset}${message}`;

		// Solo una salida a consola
		console.log(consoleMessage);
	}

	// Log a archivo
	if (LOG_TO_FILE && logFile) {
		try {
			fs.appendFileSync(logFile, `${logMessage}\n`);
		} catch (error) {
			console.error('❌ Error escribiendo log a archivo:', error);
		}
	}
}

// Middleware de logging principal
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
	const startTime = Date.now();
	const timestamp = new Date().toISOString();
	const ip = req.ip || req.connection.remoteAddress || 'unknown';
	const method = req.method;
	const url = req.originalUrl || req.url;

	// Correlación: requestId desde cabecera o generado
	const incomingId = req.get?.('x-request-id') || undefined;
	const requestId = incomingId || randomUUID();
	// Propagar en locals y respuesta
	res.locals.requestId = requestId;
	try {
		res.setHeader('X-Request-Id', requestId);
	} catch {}

	// Inyectar un logger contextual por-request en res.locals.logger
	// Evitamos duplicación: este logger está disponible para handlers/rutas, pero el middleware
	// sigue usando writeLog para su salida a archivo.
	const baseContext = { method, url, ip };
	const base = serverLogger.withContext('HTTPMiddleware').withOptions({ showRequestId: true, showPerformance: true });

	const boundLogger: RequestLogger = {
		debug: (message: string, context?: unknown) =>
			base.debug(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		info: (message: string, context?: unknown) =>
			base.info(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		warn: (message: string, context?: unknown) =>
			base.warn(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		error: (message: string, context?: unknown) =>
			base.error(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		success: (message: string, context?: unknown) =>
			base.success(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		http: (message: string, context?: unknown) =>
			base.http(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		db: (message: string, context?: unknown) =>
			base.db(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		api: (message: string, context?: unknown) =>
			base.api(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
		system: (message: string, context?: unknown) =>
			base.system(message, { ...baseContext, ...((context as object) || {}) }, requestId, startTime),
	};
	res.locals.logger = boundLogger;

	// LOG ÚNICO (eliminamos duplicación)
	const startMessage = `[rid:${requestId}] 🌐 [${timestamp}] ${method} ${url} - IP: ${ip} - START`;
	logInfo(startMessage);

	// Usar evento 'finish' de Express para capturar el final
	res.on('finish', () => {
		const endTime = Date.now();
		const duration = endTime - startTime;
		const endTimestamp = new Date().toISOString();
		const statusCode = res.statusCode;

		const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
		const endMessage = `[rid:${requestId}] ${statusEmoji} [${endTimestamp}] ${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip} - END`;

		// Log único sin duplicación
		if (statusCode >= 400) {
			logError(endMessage);
		} else {
			logInfo(endMessage);
		}
	});

	next();
};

// Middleware para logging de errores
export function errorLogger(error: any, req: Request, res: Response, next: NextFunction) {
	const { method, url, ip } = req;
	const rid = res?.locals?.requestId;
	const ridSuffix = rid ? ` - rid: ${rid}` : '';
	const errorMessage = `💥 ERROR - ${method} ${url} - IP: ${ip}${ridSuffix} - Error: ${error.message || error}`;

	writeLog(errorMessage, 'error');

	// Log stack trace si está disponible
	if (error.stack) {
		writeLog(`📚 STACK TRACE: ${error.stack}`, 'error');
	}

	next(error);
}

// Función para log manual
export function logInfo(message: string) {
	writeLog(`ℹ️  ${message}`, 'info');
}

export function logWarning(message: string) {
	writeLog(`⚠️  ${message}`, 'warn');
}

export function logError(message: string) {
	writeLog(`❌ ${message}`, 'error');
}

// Log de inicialización
logInfo('🔧 Sistema de logging inicializado');
logInfo(`📁 Logs a archivo: ${LOG_TO_FILE ? 'HABILITADO' : 'DESHABILITADO'}`);
logInfo(`🖥️  Logs a consola: ${LOG_TO_CONSOLE ? 'HABILITADO' : 'DESHABILITADO'}`);
if (LOG_TO_FILE && logFile) {
	logInfo(`📄 Archivo de log: ${logFile}`);
}
