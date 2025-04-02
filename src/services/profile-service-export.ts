/**
 * @file Exportación del servicio de Profile
 * @module services/profile
 * @description Exporta el servicio de perfiles para uso en la aplicación
 */

// Importar la instancia real del servicio
import { profileService as actualProfileService } from './profile/profile.service';

// Exportar la instancia real del servicio con el nombre esperado
export const profileService = actualProfileService;

// Re-exportar tipos desde el modelo
export type {
    CreateProfileInput,
    ProfileExtended,
    ProfileFilters,
    ProfilePaginationOptions,
    UpdateProfileInput
} from '@/types/entities/profile/types';

// Alias para mantener compatibilidad con código existente
export default profileService;