/**
 * @file Utilidades para paginación
 * @module lib/utils/pagination
 */

export interface PaginationParams {
	page: number;
	limit: number;
	offset: number;
}

export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	nextPage: number | null;
	previousPage: number | null;
}

export interface PaginatedResult<T> {
	data: T[];
	pagination: PaginationInfo;
}

/**
 * Calcula los parámetros de paginación
 */
export function calculatePagination(page = 1, limit = 10): PaginationParams {
	const normalizedPage = Math.max(1, page);
	const normalizedLimit = Math.max(1, Math.min(100, limit)); // Límite máximo de 100
	const offset = (normalizedPage - 1) * normalizedLimit;

	return {
		page: normalizedPage,
		limit: normalizedLimit,
		offset,
	};
}

/**
 * Crea información de paginación
 */
export function createPaginationInfo(currentPage: number, itemsPerPage: number, totalItems: number): PaginationInfo {
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const hasNextPage = currentPage < totalPages;
	const hasPreviousPage = currentPage > 1;

	return {
		currentPage,
		totalPages,
		totalItems,
		itemsPerPage,
		hasNextPage,
		hasPreviousPage,
		nextPage: hasNextPage ? currentPage + 1 : null,
		previousPage: hasPreviousPage ? currentPage - 1 : null,
	};
}

/**
 * Crea un resultado paginado
 */
export function createPaginatedResult<T>(
	data: T[],
	currentPage: number,
	itemsPerPage: number,
	totalItems: number
): PaginatedResult<T> {
	return {
		data,
		pagination: createPaginationInfo(currentPage, itemsPerPage, totalItems),
	};
}

/**
 * Extrae parámetros de paginación de query params
 */
export function extractPaginationFromQuery(searchParams: URLSearchParams): PaginationParams {
	const page = Number.parseInt(searchParams.get('page') || '1');
	const limit = Number.parseInt(searchParams.get('limit') || '10');

	return calculatePagination(page, limit);
}

/**
 * Genera URLs para navegación de páginas
 */
export function generatePageUrls(
	baseUrl: string,
	pagination: PaginationInfo,
	searchParams?: URLSearchParams
): {
	first: string;
	previous: string | null;
	next: string | null;
	last: string;
} {
	const createUrl = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set('page', page.toString());
		return `${baseUrl}?${params.toString()}`;
	};

	return {
		first: createUrl(1),
		previous: pagination.previousPage ? createUrl(pagination.previousPage) : null,
		next: pagination.nextPage ? createUrl(pagination.nextPage) : null,
		last: createUrl(pagination.totalPages),
	};
}
