import {
  Language,
  type ProfileExtended,
  type ProfilePreferences,
  ThemeMode,
} from '@/types/entities/profile/types';
import type { Profile } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene el texto descriptivo para un tema
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
 */
export function formatProfileDate(date: Date): string {
	return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
}

/**
 * Parsea las preferencias del perfil
 */
export function parseProfilePreferences(profile: Profile): ProfilePreferences {
	// Valores por defecto
	const defaultPreferences: ProfilePreferences = {
		theme: (profile.theme as ThemeMode) || ThemeMode.SYSTEM,
		color: profile.color || '#3b82f6',
		emoji: profile.emoji || '👤',
		language: (profile.language as Language) || Language.SPANISH,
		enableAnimations: true,
		enableSounds: false,
		enableHaptics: false,
		enableNotifications: true,
		defaultView: 'grid',
		defaultSort: 'name',
		itemsPerPage: 50,
		showHiddenFiles: false,
		highContrast: false,
		reducedMotion: false,
		fontSize: 'medium',
		outlineElements: false,
	};

	return defaultPreferences;
}

/**
 * Transforma un Profile de Prisma a un objeto extendido para UI
 */
export function transformProfile(profile: Profile): ProfileExtended {
	const createdAt = new Date(profile.createdAt);
	const updatedAt = new Date(profile.updatedAt);

	return {
		...profile,
		parsedPreferences: parseProfilePreferences(profile),
		formattedCreatedAt: formatProfileDate(createdAt),
		formattedUpdatedAt: formatProfileDate(updatedAt),
	};
}

/**
 * Transforma una lista de Profiles de Prisma a objetos extendidos
 */
export function transformProfiles(profiles: Profile[]): ProfileExtended[] {
	return profiles.map(transformProfile);
}

/**
 * Obtiene el CSS para un tema
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
 */
export function getContrastColor(hexColor: string): string {
	// Eliminar el símbolo # si existe
	const hex = hexColor.replace(/^#/, '');

	// Convertir a RGB
	let r = 0,
		g = 0,
		b = 0;

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
