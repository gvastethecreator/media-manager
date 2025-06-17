/**
 * @file Exportaciones de tipos para perfiles de usuario
 * @module types/entities/profile
 */

export * from './schema';
// Re-exportar esquemas Zod para validación
export {
	createProfileSchema,
	profileFiltersSchema,
	profilePaginationSchema,
	profilePreferencesSchema,
	updateProfilePreferencesSchema,
	updateProfileSchema,
} from './schema';

// Re-exportar tipos específicos para conveniencia
export type {
	CreateProfileInput,
	PaginatedProfiles,
	ProfileExtended,
	ProfileFilters,
	ProfilePaginationOptions,
	ProfilePreferences,
	UpdateProfileInput,
	UpdateProfilePreferencesInput,
} from './types';
export * from './types';
