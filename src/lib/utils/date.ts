/**
 * @file Utilidades centralizadas de fecha
 * @module lib/utils/date
 * @description Centraliza imports de date-fns para evitar duplicación y facilitar mantenimiento
 */

import type { Duration, FormatDurationOptions } from 'date-fns';
import {
	format as dateFnsFormat,
	formatDistanceToNow as dateFnsFormatDistanceToNow,
	formatDuration as dateFnsFormatDuration,
	intervalToDuration,
} from 'date-fns';
import { es } from 'date-fns/locale';

// Re-exportar intervalToDuration directamente
export { intervalToDuration };

// Locale español exportado
export const esLocale = es;

/**
 * Wrapper de format con locale español por defecto
 */
export function format(date: Date | number, formatStr: string, options?: { locale?: typeof es }): string {
	return dateFnsFormat(date, formatStr, { locale: es, ...options });
}

/**
 * Wrapper de formatDistanceToNow con locale español por defecto
 */
export function formatDistanceToNow(
	date: Date | number,
	options?: { addSuffix?: boolean; includeSeconds?: boolean; locale?: typeof es }
): string {
	return dateFnsFormatDistanceToNow(date, { locale: es, ...options });
}

/**
 * Wrapper de formatDuration con locale español por defecto
 */
export function formatDuration(duration: Duration, options?: Omit<FormatDurationOptions, 'locale'>): string {
	return dateFnsFormatDuration(duration, { locale: es, ...options });
}

/**
 * Formatea una fecha en formato legible
 * @param date Fecha a formatear
 * @param formatStr Formato de salida (default: 'dd/MM/yyyy')
 */
export function formatDate(date: Date | string | number, formatStr = 'dd/MM/yyyy'): string {
	const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
	return format(dateObj, formatStr);
}

/**
 * Formatea una fecha con hora
 * @param date Fecha a formatear
 */
export function formatDateTime(date: Date | string | number): string {
	return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Formatea tiempo relativo (ej: "hace 2 días")
 * @param date Fecha a formatear
 * @param addSuffix Agregar sufijo "hace..." (default: true)
 */
export function formatRelativeTime(date: Date | string | number, addSuffix = true): string {
	const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
	return formatDistanceToNow(dateObj, { addSuffix });
}

/**
 * Formatea duración en formato legible
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin (default: now)
 */
export function formatTimeDuration(startDate: Date | string | number, endDate: Date | string | number = new Date()): string {
	const start = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
	const end = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
	
	const duration = intervalToDuration({ start, end });
	return formatDuration(duration);
}
