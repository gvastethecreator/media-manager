/**
 * @file Punto de entrada para el servicio de perfiles
 * @module services/profile
 * @description Exporta todas las funcionalidades del servicio de perfiles
 */

// Exportar el cliente para componentes de cliente
export * from './client';

// Solo exportar tipos del servicio interno (no exportar la implementación)
export type {
    CreateProfileInput,
    ProfileExtended,
    ProfileFilters,
    ProfilePaginationOptions,
    UpdateProfileInput
} from './profile.service';
