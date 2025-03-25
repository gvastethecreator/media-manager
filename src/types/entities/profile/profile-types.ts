import { Profile } from "@prisma/client";

// Enums para temas
export enum ThemeMode {
  SYSTEM = "system",
  LIGHT = "light",
  DARK = "dark",
}

// Enums para idiomas
export enum Language {
  SPANISH = "es",
  ENGLISH = "en",
  PORTUGUESE = "pt",
  FRENCH = "fr",
}

// Configuración de preferencias de usuario
export interface ProfilePreferences {
  // Preferencias de tema e interfaz
  theme: ThemeMode;
  color: string;
  emoji: string;

  // Preferencias de idioma
  language: Language;

  // Preferencias de funcionalidad
  enableAnimations?: boolean;
  enableSounds?: boolean;
  enableHaptics?: boolean;
  enableNotifications?: boolean;

  // Personalización de pantalla
  defaultView?: "grid" | "list" | "gallery" | "compact";
  defaultSort?: "name" | "date" | "size" | "type";
  itemsPerPage?: number;
  showHiddenFiles?: boolean;

  // Accesibilidad
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: "small" | "medium" | "large";
  outlineElements?: boolean;
}

// Interfaz extendida para Profile
export interface ProfileExtended extends Profile {
  // Campos adicionales para UI/cliente que no están en el modelo Prisma
  parsedPreferences?: ProfilePreferences;
  formattedCreatedAt?: string;
  formattedUpdatedAt?: string;
  isCurrentProfile?: boolean;
}

// Tipo para crear un nuevo perfil
export interface CreateProfileInput {
  name: string;
  emoji?: string;
  color?: string;
  theme?: ThemeMode;
  language?: Language;
  description?: string | null;
  isActive?: boolean;
}

// Tipo para actualizar un perfil
export interface UpdateProfileInput {
  name?: string;
  emoji?: string;
  color?: string;
  theme?: ThemeMode;
  language?: Language;
  description?: string | null;
  isActive?: boolean;
}

// Tipo para actualizar preferencias
export interface UpdateProfilePreferencesInput extends Partial<ProfilePreferences> {}

// Tipo para filtros de búsqueda
export interface ProfileFilters {
  search?: string;
  isActive?: boolean;
  theme?: ThemeMode;
  language?: Language;
}

// Tipo para opciones de paginación
export interface ProfilePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
}

// Tipo para resultados paginados
export interface PaginatedProfiles {
  items: ProfileExtended[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}