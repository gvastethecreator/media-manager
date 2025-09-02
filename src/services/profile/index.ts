/**
 * @file Punto de entrada para el servicio de perfiles
 * @module services/profile
 * @description Exporta todas las funcionalidades del servicio de perfiles
 */

// Re-exportar tipos desde el cliente (evitar importar directamente del servicio interno)
export type {
	CreateProfileInput,
	ProfileExtended,
	ProfileFilters,
	ProfilePaginationOptions,
	UpdateProfileInput,
} from './client';
// Exportar el cliente para componentes de cliente
export * from './client';
