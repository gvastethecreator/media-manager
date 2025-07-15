import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Configuración de logging
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true' || true; // Por defecto habilitado
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
	if (status >= 500) return colors.red;
	if (status >= 400) return colors.yellow;
	if (status >= 300) return colors.cyan;
	if (status >= 200) return colors.green;
	return colors.white;
}

// Función para escribir log
function writeLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

	// Log a consola con colores
	if (LOG_TO_CONSOLE) {
		const colorCode = level === 'error' ? colors.red : level === 'warn' ? colors.yellow : colors.cyan;
		const consoleMessage = `${colorCode}🔍 [HTTP-LOG] ${colors.reset}${message}`;

		// Usar múltiples métodos para asegurar que aparezca
		console.log(consoleMessage);
		process.stdout.write(consoleMessage + '\n');
		process.stderr.write(`${colors.magenta}[STDERR-LOG]${colors.reset} ${message}\n`);
	}

	// Log a archivo
	if (LOG_TO_FILE && logFile) {
		try {
			fs.appendFileSync(logFile, logMessage + '\n');
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

	// 🚨 LOG DIRECTO INMEDIATO
	const startMessage = `🌐 [${timestamp}] ${method} ${url} - IP: ${ip} - START`;
	console.log(startMessage);
	process.stdout.write(startMessage + '\n');
	logInfo(startMessage);

	// Usar evento 'finish' de Express para capturar el final
	res.on('finish', () => {
		const endTime = Date.now();
		const duration = endTime - startTime;
		const endTimestamp = new Date().toISOString();
		const statusCode = res.statusCode;

		const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
		const endMessage = `${statusEmoji} [${endTimestamp}] ${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip} - END`;

		console.log(endMessage);
		process.stdout.write(endMessage + '\n');

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
	const errorMessage = `💥 ERROR - ${method} ${url} - IP: ${ip} - Error: ${error.message || error}`;

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
