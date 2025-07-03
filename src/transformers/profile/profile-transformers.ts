/**
 * @file Transformadores para perfiles de usuario
 * @module transformers/profile
 */

import type { Profile as ProfileFromPrisma } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Language, type ProfileBase, type ProfilePreferencesSchemaType, ThemeMode } from '@/types/entities/profile';
import { profilePreferencesSchema } from '@/types/entities/profile/schema';

/**
 * Tipo para el perfil extendido con datos adicionales
 */
export interface ProfileExtended extends ProfileBase {
	parsedPreferences: ProfilePreferencesSchemaType;
	formattedCreatedAt: string;
	formattedUpdatedAt: string;
}

/**
 * Obtiene el texto descriptivo para un tema
 * @param theme - Modo de tema
 * @returns Texto descriptivo del tema
 */
export function getThemeModeText(theme: ThemeMode): string {
	switch (theme) {
		case ThemeMode.LIGHT:
			return 'Claro';
		case ThemeMode.DARK:
			return 'Oscuro';
		case ThemeMode.SYSTEM:
			return 'Sistema';
		default:
			return 'Sistema';
	}
}

/**
 * Obtiene el texto descriptivo para un idioma
 * @param language - Código de idioma
 * @returns Texto descriptivo del idioma
 */
export function getLanguageText(language: Language): string {
	switch (language) {
		case Language.SPANISH:
			return 'Español';
		case Language.ENGLISH:
			return 'Inglés';
		case Language.PORTUGUESE:
			return 'Portugués';
		case Language.FRENCH:
			return 'Francés';
		default:
			return 'Español';
	}
}

/**
 * Formatea la fecha de creación/actualización del perfil
 * @param date - Fecha a formatear
 * @returns Fecha formateada
 */
export function formatProfileDate(date: Date): string {
	if (!date) return '';
	return format(new Date(date), 'PPP', { locale: es });
}

/**
 * Parsea y valida las preferencias del perfil
 * @param profile - Perfil de Prisma
 * @returns Preferencias validadas y con valores por defecto
 * @throws Error si la validación falla
 */
export function parseProfilePreferences(profile: ProfileFromPrisma): ProfilePreferencesSchemaType {
	let rawPreferences: Record<string, any> = {}; // Initialize as empty object
	try {
		// Intentar parsear las preferencias desde profile.settings si existe
		if (profile.settings && typeof profile.settings === 'string') {
			// ✨ Specific try-catch for JSON parsing ✨
			try {
				rawPreferences = JSON.parse(profile.settings);
				// Ensure rawPreferences is an object after parsing
				if (typeof rawPreferences !== 'object' || rawPreferences === null) {
					console.warn('[Profile Transformer] Parsed profile.settings is not an object, using default.');
					rawPreferences = {};
				}
			} catch (jsonError) {
				console.error('[Profile Transformer] Error parsing profile.settings JSON:', jsonError);
				rawPreferences = {}; // Default to empty object on JSON parse error
			}
		} else if (profile.settings && typeof profile.settings === 'object') {
			// Si ya es un objeto (e.g., desde una actualización previa)
			rawPreferences = profile.settings as Record<string, any>;
		} else {
			// If profile.settings is null, undefined, or other type, start with empty object
			rawPreferences = {};
		}

		// Sanitize color (outside the JSON parse try-catch)
		if (rawPreferences.color && typeof rawPreferences.color === 'string') {
			const colorRegex = /^#[0-9A-Fa-f]{6}$/;
			if (!colorRegex.test(rawPreferences.color)) {
				console.warn(`[Profile Transformer] Invalid color format '${rawPreferences.color}' found. Using default.`);
				rawPreferences.color = profilePreferencesSchema.shape.color._def.defaultValue(); // Use schema default
			}
		} else if ('color' in rawPreferences && typeof rawPreferences.color !== 'string') {
			console.warn(`[Profile Transformer] Invalid type for color ('${typeof rawPreferences.color}'). Using default.`);
			rawPreferences.color = profilePreferencesSchema.shape.color._def.defaultValue();
		} // No else needed, if color is missing, Zod default applies

		// Validar y parsear con Zod (ahora con rawPreferences más seguro)
		return profilePreferencesSchema.parse(rawPreferences);
	} catch (error) {
		console.error('[Profile Transformer] Final error parsing profile preferences:', error);
		// Retornar valores por defecto si falla la validación final
		// Parsear {} es seguro porque el schema tiene defaults para todo.
		return profilePreferencesSchema.parse({});
	}
}

/**
 * Transforma un Profile de Prisma a un objeto extendido para UI
 * @param profile - Perfil de Prisma
 * @returns Perfil extendido con datos adicionales para UI
 */
export function transformProfile(profile: ProfileFromPrisma): ProfileExtended {
	const createdAt = new Date(profile.createdAt);
	const updatedAt = new Date(profile.updatedAt);

	// Extraemos solo las propiedades de ProfileBase
	const baseProfile: ProfileBase = {
		id: profile.id,
		name: profile.name,
		emoji: profile.emoji,
		color: profile.color,
		description: profile.description,
		isActive: profile.isActive,
		createdAt,
		updatedAt,
		settingsId: profile.settingsId,
		imageId: profile.imageId,
	};

	return {
		...baseProfile,
		parsedPreferences: parseProfilePreferences(profile),
		formattedCreatedAt: formatProfileDate(createdAt),
		formattedUpdatedAt: formatProfileDate(updatedAt),
	};
}

/**
 * Transforma una lista de Profiles de Prisma a objetos extendidos
 * @param profiles - Lista de perfiles de Prisma
 * @returns Lista de perfiles extendidos
 */
export function transformProfiles(profiles: ProfileFromPrisma[]): ProfileExtended[] {
	return profiles.map(transformProfile);
}

/**
 * Obtiene el CSS para un tema
 * @param theme - Modo de tema
 * @returns Clase CSS correspondiente al tema
 */
export function getThemeClass(theme: ThemeMode): string {
	switch (theme) {
		case ThemeMode.LIGHT:
			return 'light';
		case ThemeMode.DARK:
			return 'dark';
		case ThemeMode.SYSTEM:
			return '';
		default:
			return '';
	}
}

/**
 * Obtiene el objeto de variables CSS para un color personalizado
 * @param color - Color en formato hexadecimal
 * @returns Objeto con variables CSS
 */
export function getColorStyles(color: string): Record<string, string> {
	return {
		'--primary-color': color,
		'--primary-foreground': getContrastColor(color),
		'--ring-color': `${color}33`, // Color con opacidad 20%
	};
}

/**
 * Calcula un color de contraste (blanco o negro) para un color de fondo
 * @param hexColor - Color de fondo en formato hexadecimal
 * @returns Color de contraste (#000000 o #ffffff)
 */
export function getContrastColor(hexColor: string): string {
	// Eliminar el símbolo # si existe
	const hex = hexColor.replace(/^#/, '');

	// Convertir a RGB
	let r = 0;
	let g = 0;
	let b = 0;

	if (hex.length === 3) {
		r = Number.parseInt(hex.substring(0, 1).repeat(2), 16);
		g = Number.parseInt(hex.substring(1, 2).repeat(2), 16);
		b = Number.parseInt(hex.substring(2, 3).repeat(2), 16);
	} else if (hex.length === 6) {
		r = Number.parseInt(hex.substring(0, 2), 16);
		g = Number.parseInt(hex.substring(2, 4), 16);
		b = Number.parseInt(hex.substring(4, 6), 16);
	}

	// Calcular luminosidad
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	// Retornar blanco o negro dependiendo de la luminosidad
	return luminance > 0.5 ? '#000000' : '#ffffff';
}
