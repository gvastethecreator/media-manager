/**
 * Formateador de consola para mejorar la visualización de logs en la terminal
 *
 * Este módulo proporciona funciones para formatear mensajes de log en la consola
 * con colores, iconos y estilos mejorados para una mejor legibilidad.
 */

// Colores ANSI para la consola
export const CONSOLE_COLORS = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',

	// Colores de texto
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',

	// Colores de fondo
	bgBlack: '\x1b[40m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
	bgWhite: '\x1b[47m',
};

// Estilos para diferentes tipos de logs
export const CONSOLE_LOG_STYLES = {
	debug: {
		icon: '🔍',
		label: 'DEBUG',
		color: CONSOLE_COLORS.blue,
		border: '┌─────┐\n│ 🔍 │\n└─────┘',
	},
	info: {
		icon: 'ℹ️',
		label: 'INFO',
		color: CONSOLE_COLORS.green,
		border: '┌─────┐\n│ ℹ️ │\n└─────┘',
	},
	warn: {
		icon: '⚠️',
		label: 'WARN',
		color: CONSOLE_COLORS.yellow,
		border: '┌─────┐\n│ ⚠️ │\n└─────┘',
	},
	error: {
		icon: '❌',
		label: 'ERROR',
		color: CONSOLE_COLORS.red,
		border: '┌─────┐\n│ ❌ │\n└─────┘',
	},
	success: {
		icon: '✅',
		label: 'SUCCESS',
		color: CONSOLE_COLORS.cyan,
		border: '┌─────┐\n│ ✅ │\n└─────┘',
	},
	http: {
		icon: '🌐',
		label: 'HTTP',
		color: CONSOLE_COLORS.magenta,
		border: '┌─────┐\n│ 🌐 │\n└─────┘',
	},
	db: {
		icon: '🗃️',
		label: 'DB',
		color: CONSOLE_COLORS.cyan,
		border: '┌─────┐\n│ 🗃️ │\n└─────┘',
	},
	api: {
		icon: '🔌',
		label: 'API',
		color: CONSOLE_COLORS.green,
		border: '┌─────┐\n│ 🔌 │\n└─────┘',
	},
	system: {
		icon: '⚙️',
		label: 'SYSTEM',
		color: CONSOLE_COLORS.white,
		border: '┌─────┐\n│ ⚙️ │\n└─────┘',
	},
	custom: {
		icon: '🔧',
		label: 'CUSTOM',
		color: CONSOLE_COLORS.cyan,
		border: '┌─────┐\n│ 🔧 │\n└─────┘',
	},
};

// Tipos de log soportados
export type LogType = keyof typeof CONSOLE_LOG_STYLES;

/**
 * Formatea un mensaje para la consola con colores y estilos
 * @param type Tipo de log (debug, info, warn, error, etc.)
 * @param message Mensaje principal
 * @param context Contexto del mensaje (opcional)
 * @param timestamp Incluir timestamp (opcional)
 * @param contextName Nombre del contexto (opcional)
 * @returns Mensaje formateado
 */
export function formatConsoleMessage(
	type: LogType,
	message: string,
	context?: unknown,
	timestamp = true,
	contextName?: string
): string {
	const style = CONSOLE_LOG_STYLES[type];
	const timestampStr = timestamp ? `${CONSOLE_COLORS.dim}[${new Date().toISOString()}]${CONSOLE_COLORS.reset} ` : '';
	const contextStr = contextName ? `${CONSOLE_COLORS.bright}[${contextName}]${CONSOLE_COLORS.reset} ` : '';
	const levelLabel = `${style.color}${CONSOLE_COLORS.bright}${style.label}${CONSOLE_COLORS.reset}`;

	// Formatear el contexto de datos si existe
	let contextData = '';
	if (context) {
		try {
			if (typeof context === 'string') {
				contextData = context;
			} else if (context instanceof Error) {
				contextData = `${context.message}\n${context.stack}`;
			} else {
				contextData = JSON.stringify(context, null, 2);
			}
		} catch (_e) {
			contextData = String(context);
		}
	}

	// Formato para mensajes importantes (error, warn)
	if (type === 'error' || type === 'warn') {
		return `
${style.color}${style.border}${CONSOLE_COLORS.reset}
${timestampStr}${levelLabel} ${contextStr}
${style.color}┌${'─'.repeat(message.length + 2)}┐${CONSOLE_COLORS.reset}
${style.color}│ ${CONSOLE_COLORS.reset}${message}${style.color} │${CONSOLE_COLORS.reset}
${style.color}└${'─'.repeat(message.length + 2)}┘${CONSOLE_COLORS.reset}
${contextData ? `${contextData}\n` : ''}`;
	}

	// Formato para mensajes normales
	return `${timestampStr}${style.icon} ${levelLabel} ${contextStr}${message}${contextData ? `\n${contextData}` : ''}`;
}

/**
 * Formatea un mensaje para la consola con un estilo personalizado
 * @param message Mensaje principal
 * @param options Opciones de formato
 * @returns Mensaje formateado
 */
export function formatCustomMessage(
	message: string,
	options: {
		icon?: string;
		label?: string;
		color?: string;
		timestamp?: boolean;
		contextName?: string;
		context?: unknown;
	} = {}
): string {
	const {
		icon = '🔧',
		label = 'CUSTOM',
		color = CONSOLE_COLORS.cyan,
		timestamp = true,
		contextName,
		context,
	} = options;

	const timestampStr = timestamp ? `${CONSOLE_COLORS.dim}[${new Date().toISOString()}]${CONSOLE_COLORS.reset} ` : '';
	const contextStr = contextName ? `${CONSOLE_COLORS.bright}[${contextName}]${CONSOLE_COLORS.reset} ` : '';
	const levelLabel = `${color}${CONSOLE_COLORS.bright}${label}${CONSOLE_COLORS.reset}`;

	// Formatear el contexto de datos si existe
	let contextData = '';
	if (context) {
		try {
			if (typeof context === 'string') {
				contextData = context;
			} else if (context instanceof Error) {
				contextData = `${context.message}\n${context.stack}`;
			} else {
				contextData = JSON.stringify(context, null, 2);
			}
		} catch (_e) {
			contextData = String(context);
		}
	}

	return `${timestampStr}${icon} ${levelLabel} ${contextStr}${message}${contextData ? `\n${contextData}` : ''}`;
}

/**
 * Crea un separador visual para la consola
 * @param title Título opcional para el separador
 * @param color Color del separador (por defecto cyan)
 * @returns Separador formateado
 */
export function createSeparator(title?: string, color = CONSOLE_COLORS.cyan): string {
	const width = process.stdout?.columns || 80;
	const line = '─'.repeat(width - 2);

	if (title) {
		const paddedTitle = ` ${title} `;
		const leftPadding = Math.floor((width - paddedTitle.length - 2) / 2);
		const rightPadding = width - paddedTitle.length - 2 - leftPadding;

		return `${color}┌${'─'.repeat(leftPadding)}${CONSOLE_COLORS.bright}${paddedTitle}${CONSOLE_COLORS.reset}${color}${'─'.repeat(rightPadding)}┐${CONSOLE_COLORS.reset}`;
	}

	return `${color}┌${line}┐${CONSOLE_COLORS.reset}`;
}

/**
 * Crea un cierre de separador visual para la consola
 * @param color Color del separador (por defecto cyan)
 * @returns Separador formateado
 */
export function createSeparatorEnd(color = CONSOLE_COLORS.cyan): string {
	const width = process.stdout?.columns || 80;
	const line = '─'.repeat(width - 2);

	return `${color}└${line}┘${CONSOLE_COLORS.reset}`;
}

/**
 * Crea un bloque de texto con borde para la consola
 * @param text Texto a mostrar en el bloque
 * @param options Opciones de formato
 * @returns Bloque formateado
 */
export function createTextBlock(
	text: string,
	options: {
		title?: string;
		color?: string;
		padding?: number;
		width?: number;
	} = {}
): string {
	const { title, color = CONSOLE_COLORS.cyan, padding = 1, width = process.stdout?.columns || 80 } = options;

	const lines = text.split('\n');
	const contentWidth = width - 2 - padding * 2;
	const paddingStr = ' '.repeat(padding);

	let result = '';

	// Línea superior con título opcional
	if (title) {
		const paddedTitle = ` ${title} `;
		const leftPadding = Math.floor((width - paddedTitle.length - 2) / 2);
		const rightPadding = width - paddedTitle.length - 2 - leftPadding;

		result += `${color}┌${'─'.repeat(leftPadding)}${CONSOLE_COLORS.bright}${paddedTitle}${CONSOLE_COLORS.reset}${color}${'─'.repeat(rightPadding)}┐${CONSOLE_COLORS.reset}\n`;
	} else {
		result += `${color}┌${'─'.repeat(width - 2)}┐${CONSOLE_COLORS.reset}\n`;
	}

	// Contenido con padding
	for (const line of lines) {
		const paddedLine =
			line.length > contentWidth ? `${line.substring(0, contentWidth - 3)}...` : line.padEnd(contentWidth, ' ');

		result += `${color}│${CONSOLE_COLORS.reset}${paddingStr}${paddedLine}${paddingStr}${color}│${CONSOLE_COLORS.reset}\n`;
	}

	// Línea inferior
	result += `${color}└${'─'.repeat(width - 2)}┘${CONSOLE_COLORS.reset}`;

	return result;
}

/**
 * Crea una tabla simple para la consola
 * @param data Datos para la tabla (array de objetos)
 * @param options Opciones de formato
 * @returns Tabla formateada
 */
export function createConsoleTable<T extends Record<string, unknown>>(
	data: T[],
	options: {
		title?: string;
		color?: string;
		columns?: (keyof T)[];
		columnLabels?: Record<string, string>;
	} = {}
): string {
	if (!data.length) {
		return createTextBlock('No data available', { title: options.title, color: options.color });
	}

	const {
		title,
		color = CONSOLE_COLORS.cyan,
		columns = Object.keys(data[0]) as (keyof T)[],
		columnLabels = {},
	} = options;

	// Determinar el ancho de cada columna
	const columnWidths: Record<string, number> = {};

	// Inicializar con el ancho de las etiquetas de columna
	for (const col of columns) {
		const colStr = String(col);
		columnWidths[colStr] = Math.max(colStr.length, columnLabels[colStr]?.length || 0);
	}

	// Ajustar según el contenido
	for (const row of data) {
		for (const col of columns) {
			const colStr = String(col);
			const value = String(row[col] ?? '');
			columnWidths[colStr] = Math.max(columnWidths[colStr], value.length);
		}
	}

	// Construir la tabla
	let result = '';

	// Título si existe
	if (title) {
		const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0) + columns.length * 3 + 1;
		const paddedTitle = ` ${title} `;
		const leftPadding = Math.floor((totalWidth - paddedTitle.length) / 2);
		const rightPadding = totalWidth - paddedTitle.length - leftPadding;

		result += `${color}┌${'─'.repeat(leftPadding)}${CONSOLE_COLORS.bright}${paddedTitle}${CONSOLE_COLORS.reset}${color}${'─'.repeat(rightPadding)}┐${CONSOLE_COLORS.reset}\n`;
	} else {
		const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0) + columns.length * 3 + 1;
		result += `${color}┌${'─'.repeat(totalWidth - 2)}┐${CONSOLE_COLORS.reset}\n`;
	}

	// Encabezados
	result += `${color}│${CONSOLE_COLORS.reset}`;
	for (const col of columns) {
		const colStr = String(col);
		const label = columnLabels[colStr] || colStr;
		result += ` ${CONSOLE_COLORS.bright}${label.padEnd(columnWidths[colStr])}${CONSOLE_COLORS.reset} ${color}│${CONSOLE_COLORS.reset}`;
	}
	result += '\n';

	// Separador
	result += `${color}├${CONSOLE_COLORS.reset}`;
	for (const col of columns) {
		const colStr = String(col);
		result += `${color}${'─'.repeat(columnWidths[colStr] + 2)}┼${CONSOLE_COLORS.reset}`;
	}
	// Corregir el último caracter
	result = `${result.slice(0, -1)}${color}┤${CONSOLE_COLORS.reset}\n`;

	// Filas de datos
	for (const row of data) {
		result += `${color}│${CONSOLE_COLORS.reset}`;
		for (const col of columns) {
			const colStr = String(col);
			const value = String(row[col] ?? '');
			result += ` ${value.padEnd(columnWidths[colStr])} ${color}│${CONSOLE_COLORS.reset}`;
		}
		result += '\n';
	}

	// Línea inferior
	const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0) + columns.length * 3 + 1;
	result += `${color}└${'─'.repeat(totalWidth - 2)}┘${CONSOLE_COLORS.reset}`;

	return result;
}

/**
 * Crea un mensaje de progreso para la consola
 * @param message Mensaje descriptivo
 * @param progress Valor de progreso (0-100)
 * @param options Opciones de formato
 * @returns Mensaje de progreso formateado
 */
export function createProgressBar(
	message: string,
	progress: number,
	options: {
		width?: number;
		color?: string;
		showPercentage?: boolean;
		showValue?: boolean;
		min?: number;
		max?: number;
	} = {}
): string {
	const {
		width = 40,
		color = CONSOLE_COLORS.cyan,
		showPercentage = true,
		showValue = false,
		min = 0,
		max = 100,
	} = options;

	// Normalizar el progreso entre 0 y 1
	const normalizedProgress = Math.max(0, Math.min(1, (progress - min) / (max - min)));
	const percentage = Math.round(normalizedProgress * 100);

	// Calcular la barra de progreso
	const filledWidth = Math.round(width * normalizedProgress);
	const emptyWidth = width - filledWidth;

	const bar = `${color}[${'█'.repeat(filledWidth)}${' '.repeat(emptyWidth)}]${CONSOLE_COLORS.reset}`;

	let result = `${message} ${bar}`;

	if (showPercentage) {
		result += ` ${percentage}%`;
	}

	if (showValue) {
		result += ` (${progress}/${max})`;
	}

	return result;
}

/**
 * Crea un mensaje de tiempo transcurrido para la consola
 * @param label Etiqueta descriptiva
 * @param startTime Tiempo de inicio (en ms)
 * @param options Opciones de formato
 * @returns Mensaje de tiempo formateado
 */
export function createElapsedTime(
	label: string,
	startTime: number,
	options: {
		color?: string;
		showMs?: boolean;
	} = {}
): string {
	const { color = CONSOLE_COLORS.green, showMs = true } = options;

	const elapsed = Date.now() - startTime;

	// Formatear el tiempo
	let timeStr: string;
	if (elapsed < 1000 || showMs) {
		timeStr = `${elapsed}ms`;
	} else if (elapsed < 60_000) {
		timeStr = `${(elapsed / 1000).toFixed(2)}s`;
	} else {
		const minutes = Math.floor(elapsed / 60_000);
		const seconds = ((elapsed % 60_000) / 1000).toFixed(2);
		timeStr = `${minutes}m ${seconds}s`;
	}

	return `${label}: ${color}${timeStr}${CONSOLE_COLORS.reset}`;
}
