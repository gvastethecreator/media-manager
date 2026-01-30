import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('TransformerUtils');

/**
 * 🔄 Serializa un campo a formato JSON
 * @param field Campo a serializar
 * @param defaultValue Valor por defecto si el campo es nulo o indefinido
 * @returns String JSON serializado
 */
export function serializeJsonField<T>(field: T | null | undefined, defaultValue = '[]'): string {
	if (!field) {
		return defaultValue;
	}
	try {
		return JSON.stringify(field);
	} catch (error) {
		logger.error('Error serializando campo:', { error, field });
		return defaultValue;
	}
}

/**
 * 🔄 Deserializa un campo JSON a su tipo original
 * @param field Campo JSON a deserializar
 * @param defaultValue Valor por defecto si el campo es nulo o inválido
 * @returns Objeto deserializado del tipo T
 */
export function deserializeJsonField<T>(field: string | null | undefined, defaultValue: T): T {
	if (!field || field === '[]' || field === '{}') {
		return defaultValue;
	}
	try {
		return JSON.parse(field) as T;
	} catch (error) {
		logger.error('Error deserializando campo:', { error, field });
		return defaultValue;
	}
}

/**
 * 🔍 Verifica que los campos requeridos existan y no sean nulos
 * @param data Objeto a validar
 * @param requiredFields Array de campos requeridos
 * @throws Error si algún campo requerido falta o es nulo
 */
export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): void {
	for (const field of requiredFields) {
		if (data[field] === undefined || data[field] === null) {
			throw new Error(`Campo requerido ${field} falta o es nulo`);
		}
	}
}

/**
 * 🎯 Verifica que un campo sea del tipo esperado
 * @param value Valor a verificar
 * @param type Tipo esperado ('string', 'number', 'boolean', 'object', 'array')
 * @param fieldName Nombre del campo para el mensaje de error
 * @throws Error si el campo no es del tipo esperado
 */
export function validateFieldType(value: unknown, type: string, fieldName: string): void {
	if (type === 'array' && !Array.isArray(value)) {
		throw new Error(`El campo ${fieldName} debe ser un array`);
	}

	if (
		type !== 'array' &&
		((type === 'string' && typeof value !== 'string') ||
			(type === 'number' && typeof value !== 'number') ||
			(type === 'boolean' && typeof value !== 'boolean') ||
			(type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))))
	) {
		throw new Error(`El campo ${fieldName} debe ser de tipo ${type}`);
	}
}

/**
 * 🎨 Maneja campos de UI comunes
 */
export interface UIFields {
	emoji?: string;
	color?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * 📊 Maneja campos de metadata comunes
 */
export interface MetadataFields {
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * 🔍 Opciones base para transformers
 */
export interface BaseTransformerOptions {
	includeCount?: boolean;
	includeRelations?: boolean;
	validateFields?: boolean;
}

/**
 * ✨ Resultado de una transformación
 */
export interface TransformerResult<T> {
	success: boolean;
	data?: T;
	error?: Error;
}
