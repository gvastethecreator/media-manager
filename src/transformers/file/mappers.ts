/**
 * @file Mappers para la entidad File.
 * @module transformers/file/mappers
 * @description Contiene funciones para transformar datos de File entre tipos base y enriquecidos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { createDefaultEntityStats, formatFileSize } from '@/lib/utils';
import { type FileBase, type FileStatistics, FileType, type FileWithStats } from '../../types/entities/file';

/**
 * 📊 Calcula las estadísticas de un archivo.
 *
 * @param file - El archivo base desde Drizzle
 * @returns Las estadísticas calculadas del archivo
 */
function calculateFileStats(file: FileBase): FileStatistics {
	const now = new Date();
	const modifiedAt = new Date(file.modifiedAt);
	const accessedAt = new Date(file.accessedAt);

	const daysSinceModified = Math.floor((now.getTime() - modifiedAt.getTime()) / (1000 * 60 * 60 * 24));
	const daysSinceAccessed = Math.floor((now.getTime() - accessedAt.getTime()) / (1000 * 60 * 60 * 24));

	return {
		...createDefaultEntityStats({
			size: file.size,
			mtime: modifiedAt,
			birthtime: file.createdAt,
			type: file.type,
			// mapear conteos básicos si proceden
			totalItems: 1,
		}),
		formattedSize: formatFileSize(file.size),
		typeLabel: file.type,
		iconName: 'file',
		colorCode: 'var(--dt-neutral-500)',
		daysSinceModified,
		daysSinceAccessed,
		isRecent: daysSinceModified <= 7,
		isLarge: file.size > 100 * 1024 * 1024, // > 100MB
		formattedModifiedAt: modifiedAt.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}),
		childCount: file.isDirectory ? 0 : 0, // Valor por defecto
		shortPath: file.relativePath || file.name,
		checksum: file.hash,
		isDirectory: file.isDirectory,
		isFile: !file.isDirectory,
	};
}

/**
 * 📁 Transforma un archivo base en un archivo con estadísticas.
 * Esta es la función principal de transformación para la entidad File.
 *
 * @param file - El archivo base desde Drizzle
 * @returns Un archivo enriquecido con estadísticas calculadas
 */
export function toFileWithStats(file: FileBase): FileWithStats {
	const stats = calculateFileStats(file);

	return {
		...file,
		stats,
	};
}

/**
 * 📁 Transforma una lista de archivos base en archivos con estadísticas.
 *
 * @param files - Lista de archivos base desde Drizzle
 * @returns Lista de archivos enriquecidos con estadísticas
 */
export function toFileWithStatsList(files: FileBase[]): FileWithStats[] {
	return files.map(toFileWithStats);
}

/**
 * 📂 Agrupa archivos por tipo.
 *
 * @param files - Lista de archivos con estadísticas
 * @returns Objeto con archivos agrupados por tipo
 */
export function groupFilesByType(files: FileWithStats[]): Record<FileType, FileWithStats[]> {
	const grouped = {} as Record<FileType, FileWithStats[]>;

	// Inicializar grupos vacíos
	for (const type of Object.values(FileType)) {
		grouped[type] = [];
	}

	// Agrupar archivos
	for (const file of files) {
		if (grouped[file.type]) {
			grouped[file.type].push(file);
		}
	}

	return grouped;
}
