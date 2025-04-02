'use client';

/**
 * @file Cliente para consumir acciones del servidor relacionadas con perfiles
 * @module services/profile/client
 */

import {
    activateProfile,
    createProfile,
    deleteProfile,
    getActiveProfile,
    getProfile,
    getProfiles,
    updateProfile
} from '@/app/actions/profiles';

import type {
    CreateProfileInput,
    ProfileExtended,
    ProfileFilters,
    ProfilePaginationOptions,
    UpdateProfileInput
} from '@/types/entities/profile/types';

/**
 * Cliente para consumir funcionalidades de perfiles desde componentes de cliente
 *
 * Este cliente utiliza las Server Actions definidas en app/actions/profiles
 * en lugar de intentar ejecutar código de Prisma directamente en el navegador.
 */
export const profileClient = {
    /**
     * Obtiene todos los perfiles con filtros y paginación
     */
    getProfiles: (filters?: ProfileFilters, pagination?: ProfilePaginationOptions) =>
        getProfiles(filters, pagination),

    /**
     * Obtiene un perfil por su ID
     */
    getProfileById: (id: string) =>
        getProfile(id),

    /**
     * Obtiene el perfil activo actual
     */
    getActiveProfile: () =>
        getActiveProfile(),

    /**
     * Crea un nuevo perfil
     */
    createProfile: (data: CreateProfileInput) =>
        createProfile(data),

    /**
     * Actualiza un perfil existente
     */
    updateProfile: (id: string, data: UpdateProfileInput) =>
        updateProfile(id, data),

    /**
     * Establece un perfil como activo
     */
    setActiveProfile: (id: string) =>
        activateProfile(id),

    /**
     * Elimina un perfil
     */
    deleteProfile: (id: string) =>
        deleteProfile(id),

    /**
     * Asegura que existe un perfil por defecto
     */
    ensureDefaultProfile: () =>
        getActiveProfile() // Usamos getActiveProfile como sustituto para ensureDefaultProfile
};

// Re-exportar tipos para conveniencia
export type {
    CreateProfileInput,
    ProfileExtended,
    ProfileFilters,
    ProfilePaginationOptions,
    UpdateProfileInput
};
