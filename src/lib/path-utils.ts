import { existsSync } from 'fs';
import { normalize, sep } from 'node:path';
import { serverLogger } from './logger/server-logger';

const pathUtilsLogger = serverLogger.withContext('PathUtils');

/**
 * Normaliza una ruta para uso en el sistema
 * @param path Ruta a normalizar
 * @returns Ruta normalizada
 */
export function normalizePath(path: string): string {
	// Normalizar separadores según el sistema operativo
	let normalized = normalize(path)
		.replace(/[\/\\]+/g, sep) // Reemplazar múltiples separadores con el separador del sistema
		.trim();

	// Normalizar variaciones comunes en rutas
	normalized = normalized
		.replace(/outpu+ts/gi, 'outputs') // Variantes como 'outputs', 'outpuuts', etc.
		.replace(/out[p]+uts/gi, 'outputs') // Variantes como 'outpputs'
		.replace(/s+dmatrix/gi, 'sdmatrix'); // Variantes de SDMatrix

	return normalized;
}

/**
 * Genera variantes de una ruta para intentar localizar carpetas
 * @param path Ruta base para generar variantes
 * @returns Array de variantes de la ruta
 */
export function generatePathVariants(path: string): string[] {
	const variants: string[] = [path];

	// Variant 1: Cambiar \ por /
	variants.push(path.replace(/\\/g, '/'));

	// Variant 2: Cambiar / por \
	variants.push(path.replace(/\//g, '\\'));

	// Variant 3-5: Variaciones con outputs/outpuuts/outpputs
	if (path.includes('outputs') || path.includes('OUTPUTS')) {
		variants.push(path.replace(/outputs/gi, 'outpuuts'));
		variants.push(path.replace(/outputs/gi, 'outpputs'));
		variants.push(path.replace(/out(p*)uts/gi, 'outputs'));
	}

	// Variant 6-7: Variaciones con sdmatrix/ssdmatrix
	if (path.includes('sdmatrix')) {
		variants.push(path.replace(/sdmatrix/gi, 'ssdmatrix'));
	} else if (path.includes('ssdmatrix')) {
		variants.push(path.replace(/ssdmatrix/gi, 'sdmatrix'));
	}

	return [...new Set(variants)]; // Eliminar duplicados
}

/**
 * Verifica si una ruta existe, probando múltiples variantes
 * @param normalizedPath Ruta normalizada para verificar
 * @param originalPath Ruta original para generar variantes adicionales
 * @returns Objeto con información sobre la existencia y variantes verificadas
 */
export function checkPathExists(
	normalizedPath: string,
	originalPath: string
): {
	exists: boolean;
	foundPath?: string;
	checkedPaths: string[];
} {
	// Comprobar la ruta normalizada directamente
	if (existsSync(normalizedPath)) {
		return { exists: true, foundPath: normalizedPath, checkedPaths: [normalizedPath] };
	}

	// Comprobar la ruta original por si acaso
	if (normalizedPath !== originalPath && existsSync(originalPath)) {
		return { exists: true, foundPath: originalPath, checkedPaths: [normalizedPath, originalPath] };
	}

	// Generar variantes para verificar
	const normalizedVariants = generatePathVariants(normalizedPath);
	const originalVariants = normalizedPath !== originalPath ? generatePathVariants(originalPath) : [];

	// Combinar todas las variantes y eliminar duplicados
	const allVariants = [...new Set([...normalizedVariants, ...originalVariants])];

	// Verificar cada variante
	for (const variant of allVariants) {
		if (existsSync(variant)) {
			pathUtilsLogger.info('✓ Carpeta encontrada con una variante de ruta:', {
				original: originalPath,
				normalized: normalizedPath,
				found: variant,
			});
			return { exists: true, foundPath: variant, checkedPaths: allVariants };
		}
	}

	// Si llegamos aquí, ninguna variante existe
	return { exists: false, checkedPaths: allVariants };
}
