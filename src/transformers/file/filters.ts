/**
 * @file Funciones de filtrado para la entidad File.
 * @module transformers/file/filters
 * @description Funciones para aplicar filtros a archivos usando FileFilterOptions.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { FileType } from '@/types/entities/file/base';
import { FileFilterOptions } from '@/types/entities/file/types';
import { FileWithStats } from './validators';

/**
 * 🔍 Aplica filtros a una lista de archivos basándose en FileFilterOptions.
 *
 * @param files - Lista de archivos a filtrar
 * @param options - Opciones de filtrado
 * @returns Lista de archivos filtrados
 */
export function applyFileFilters(files: FileWithStats[], options: FileFilterOptions): FileWithStats[] {
	if (!options || Object.keys(options).length === 0) {
		return files;
	}

	let filtered = [...files];

	// Filtrar por tipos de archivo
	if (options.fileTypes && options.fileTypes.length > 0) {
		filtered = filtered.filter(file => options.fileTypes?.includes(file.type as FileType));
	}

	// Filtrar por extensiones
	if (options.extensions && options.extensions.length > 0) {
		filtered = filtered.filter(file => {
			const extension = file.name.toLowerCase().split('.').pop() || '';
			return options.extensions?.some(ext => ext.toLowerCase() === extension);
		});
	}

	// Filtrar por tamaño mínimo
	if (options.minSize !== undefined) {
		filtered = filtered.filter(file => (file.size || 0) >= (options.minSize || 0));
	}

	// Filtrar por tamaño máximo
	if (options.maxSize !== undefined) {
		filtered = filtered.filter(file => (file.size || 0) <= (options.maxSize || 0));
	}

	// Filtrar por fecha de modificación después
	if (options.modifiedAfter) {
		filtered = filtered.filter(file => new Date(file.modifiedAt) >= (options.modifiedAfter || new Date(0)));
	}

	// Filtrar por fecha de modificación antes
	if (options.modifiedBefore) {
		filtered = filtered.filter(file => new Date(file.modifiedAt) <= (options.modifiedBefore || new Date()));
	}

	// Filtrar por término de búsqueda (si está incluido en options)
	if (options.searchTerm?.trim()) {
		const term = options.searchTerm.toLowerCase();
		filtered = filtered.filter(file =>
			file.name.toLowerCase().includes(term) ||
			file.path.toLowerCase().includes(term) ||
			file.type.toLowerCase().includes(term)
		);
	}

	return filtered;
}

/**
 * 📋 Aplica ordenación a una lista de archivos.
 *
 * @param files - Lista de archivos a ordenar
 * @param sortBy - Campo por el que ordenar
 * @param sortOrder - Orden ascendente o descendente
 * @returns Lista de archivos ordenados
 */
export function applySortToFiles(
	files: FileWithStats[],
	sortBy: keyof FileWithStats = 'name',
	sortOrder: 'asc' | 'desc' = 'asc'
): FileWithStats[] {
	return [...files].sort((a, b) => {
		let comparison = 0;

		// Siempre mostrar directorios primero si se ordena por nombre
		if (sortBy === 'name') {
			if (a.isDirectory !== b.isDirectory) {
				return a.isDirectory ? -1 : 1;
			}
		}

		// Ordenar por el campo específico
		switch (sortBy) {
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'size':
				comparison = (a.size || 0) - (b.size || 0);
				break;
			case 'type':
				comparison = a.type.localeCompare(b.type);
				break;
			case 'createdAt':
				comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				break;
			case 'modifiedAt':
				comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
				break;
			default:
				comparison = 0;
		}

		// Aplicar dirección de ordenación
		return sortOrder === 'asc' ? comparison : -comparison;
	});
}

/**
 * 🔍📋 Aplica filtros y ordenación a una lista de archivos.
 *
 * @param files - Lista de archivos a procesar
 * @param options - Opciones de filtrado
 * @returns Lista de archivos filtrados y ordenados
 */
export function applyFileFiltersAndSort(files: FileWithStats[], options: FileFilterOptions): FileWithStats[] {
	let processed = applyFileFilters(files, options);

	if (options.sortBy && options.sortOrder) {
		processed = applySortToFiles(processed, options.sortBy, options.sortOrder);
	}

	return processed;
}
