'use server';

import { logger } from '@/lib/logger/logger';

/**
 * Tipo para los datos de generación por IA
 */
export interface AIGenerationMetadata {
	type: string;
	prompt?: string;
	negative_prompt?: string;
	model?: string;
	steps?: number;
	cfg_scale?: number;
	cfg?: number;
	seed?: number | string;
	sampler?: string;
	scheduler?: string;
	clip_skip?: number;
	workflow?: string;
	extra_params?: Record<string, string | number | boolean | null | undefined | string[]>;
}

/**
 * Tipo para las funciones de parseo
 */
export type ParserFunction = (metadata: Record<string, unknown>) => Promise<AIGenerationMetadata | null>;

/**
 * Interfaz para un parser
 */
export interface AIGenerationParserModule {
	/**
	 * Nombre identificativo del parser
	 */
	name: string;

	/**
	 * Función para determinar si este parser puede procesar los metadatos
	 */
	canParse: (metadata: Record<string, unknown>) => Promise<boolean>;

	/**
	 * Función para extraer y convertir los metadatos
	 */
	parse: ParserFunction;
}

/**
 * Logger común para los parsers de generación por IA
 * (No exportado directamente - ahora es una función interna)
 */
const parserLogger = logger.withContext('AIGenerationParser');

/**
 * Obtener el logger del parser (versión async exportada)
 */
export async function getParserLogger() {
	return parserLogger;
}

/**
 * Función para convertir valores numéricos almacenados como string
 * (Function interna - no exportada)
 */
function convertToNumber(value: unknown): number | string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === 'number') {
		return value;
	}

	if (typeof value === 'string') {
		const numValue = Number(value);
		return Number.isNaN(numValue) ? value : numValue;
	}

	return String(value);
}

/**
 * Función para extraer propiedades específicas de un objeto
 * (Function interna - no exportada)
 */
function extractProperties<T extends Record<string, unknown>>(
	source: Record<string, unknown>,
	properties: string[],
	transform?: (key: string, value: unknown) => unknown
): T {
	const result = {} as T;

	for (const prop of properties) {
		if (source[prop] !== undefined) {
			result[prop as keyof T] = transform
				? (transform(prop, source[prop]) as T[keyof T])
				: (source[prop] as T[keyof T]);
		}
	}

	return result;
}

/**
 * Exportación de función convertToNumber pero de forma async
 */
export async function convertToNumberAsync(value: unknown): Promise<number | string | undefined> {
	return convertToNumber(value);
}

/**
 * Exportación de función extractProperties pero de forma async
 */
export async function extractPropertiesAsync<T extends Record<string, unknown>>(
	source: Record<string, unknown>,
	properties: string[],
	transform?: (key: string, value: unknown) => unknown
): Promise<T> {
	return extractProperties<T>(source, properties, transform);
}
