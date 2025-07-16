/**
 * @file Mappers para la entidad File.
 * @module transformers/file/mappers
 * @description Contiene funciones para transformar datos de File entre tipos base y enriquecidos.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { FileBase, FileStatistics, FileType, FileWithStats } from '@/types/entities/file';

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

	// Mapeo de tipos a etiquetas legibles
	const typeLabels: Record<FileType, string> = {
		[FileType.IMAGE]: 'Imagen',
		[FileType.VIDEO]: 'Video',
		[FileType.AUDIO]: 'Audio',
		[FileType.DOCUMENT]: 'Documento',
		[FileType.TEXT]: 'Texto',
		[FileType.ARCHIVE]: 'Archivo',
		[FileType.CODE]: 'Código',
		[FileType.EXECUTABLE]: 'Ejecutable',
		[FileType.FONT]: 'Fuente',
		[FileType.DATA]: 'Datos',
		[FileType.UNKNOWN]: 'Desconocido',
	};

	// Mapeo de tipos a iconos
	const typeIcons: Record<FileType, string> = {
		[FileType.IMAGE]: 'image',
		[FileType.VIDEO]: 'video',
		[FileType.AUDIO]: 'music',
		[FileType.DOCUMENT]: 'file-text',
		[FileType.TEXT]: 'file-text',
		[FileType.ARCHIVE]: 'archive',
		[FileType.CODE]: 'code',
		[FileType.EXECUTABLE]: 'play',
		[FileType.FONT]: 'type',
		[FileType.DATA]: 'database',
		[FileType.UNKNOWN]: 'file',
	};

	// Mapeo de tipos a colores
	const typeColors: Record<FileType, string> = {
		[FileType.IMAGE]: '#e74c3c',
		[FileType.VIDEO]: '#9b59b6',
		[FileType.AUDIO]: '#f39c12',
		[FileType.DOCUMENT]: '#3498db',
		[FileType.TEXT]: '#2ecc71',
		[FileType.ARCHIVE]: '#95a5a6',
		[FileType.CODE]: '#e67e22',
		[FileType.EXECUTABLE]: '#34495e',
		[FileType.FONT]: '#1abc9c',
		[FileType.DATA]: '#8e44ad',
		[FileType.UNKNOWN]: '#7f8c8d',
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const getShortPath = (fullPath: string): string => {
		const segments = fullPath.split('/').filter(Boolean);
		if (segments.length <= 3) return fullPath;
		return `.../${segments.slice(-2).join('/')}`;
	};

	return {
		formattedSize: formatFileSize(file.size),
		typeLabel: typeLabels[file.type] || 'Desconocido',
		iconName: typeIcons[file.type] || 'file',
		colorCode: typeColors[file.type] || '#7f8c8d',
		daysSinceModified,
		daysSinceAccessed,
		isRecent: daysSinceModified <= 7,
		isLarge: file.size > 100 * 1024 * 1024, // > 100MB
		formattedModifiedAt: modifiedAt.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}),
		childCount: file.isDirectory ? 0 : 0, // Placeholder - se calcularía desde una consulta
		shortPath: getShortPath(file.relativePath),
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
 * 📂 Filtra archivos por tipo.
 *
 * @param files - Lista de archivos con estadísticas
 * @param types - Tipos de archivo a incluir
 * @returns Lista filtrada de archivos
 */
export function filterFilesByType(files: FileWithStats[], types: FileType[]): FileWithStats[] {
	if (types.length === 0) return files;
	return files.filter((file) => types.includes(file.type));
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

/**
 * 📊 Ordena archivos por criterio especificado.
 *
 * @param files - Lista de archivos con estadísticas
 * @param sortBy - Campo por el cual ordenar
 * @param order - Orden ascendente o descendente
 * @returns Lista ordenada de archivos
 */
export function sortFiles(
	files: FileWithStats[],
	sortBy: 'name' | 'size' | 'modifiedAt' | 'type' = 'name',
	order: 'asc' | 'desc' = 'asc'
): FileWithStats[] {
	return files.sort((a, b) => {
		let compareValue = 0;

		switch (sortBy) {
			case 'name':
				compareValue = a.name.localeCompare(b.name);
				break;
			case 'size':
				compareValue = a.size - b.size;
				break;
			case 'modifiedAt':
				compareValue = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
				break;
			case 'type':
				compareValue = a.type.localeCompare(b.type);
				break;
		}

		return order === 'desc' ? -compareValue : compareValue;
	});
}
