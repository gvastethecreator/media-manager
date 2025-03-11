import { type LogLevel, loggerConfig } from './logger.config';

const _LOG_COLORS = {
	debug: '\x1b[34m', // blue
	info: '\x1b[32m', // green
	warn: '\x1b[33m', // yellow
	error: '\x1b[31m', // red
	reset: '\x1b[0m', // reset
};

interface LoggerOptions {
	context?: string;
	timestamp?: boolean;
	level?: LogLevel;
}

export class Logger {
	private context: string;
	private timestamp: boolean;
	private level: LogLevel;

	constructor(options: LoggerOptions = {}) {
		this.context = options.context || 'App';
		this.timestamp = options.timestamp ?? true;
		this.level = options.level || 'info';
	}

	private getTimestamp(): string {
		return new Date().toISOString();
	}

	private formatMessage(level: string, message: string, context?: unknown): string {
		const timestamp = this.timestamp ? `[${this.getTimestamp()}] ` : '';
		const contextStr = `[${this.context}] `;
		const contextData = context ? JSON.stringify(context) : '';
		return `${timestamp}${level} ${contextStr}${message}${contextData ? ` ${contextData}` : ''}`;
	}

	withContext(context: string): Logger {
		return new Logger({ ...this, context });
	}

	debug(message: string, context?: unknown): void {
		if (this.shouldLog('debug')) {
			console.debug(this.formatMessage('🔍 DEBUG', message, context));
		}
	}

	info(message: string, context?: unknown): void {
		if (this.shouldLog('info')) {
			console.info(this.formatMessage('ℹ️ INFO', message, context));
		}
	}

	warn(message: string, context?: unknown): void {
		if (this.shouldLog('warn')) {
			console.warn(this.formatMessage('⚠️ WARN', message, context));
		}
	}

	error(message: string, context?: unknown): void {
		if (this.shouldLog('error')) {
			console.error(this.formatMessage('❌ ERROR', message, context));
		}
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
		return levels.indexOf(level) >= levels.indexOf(this.level);
	}
}

export const logger = new Logger();
