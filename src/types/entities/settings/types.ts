// src/types/entities/settings/types.ts
// Tipos canónicos para preferencias de interfaz de usuario
// 📝 Documentado según lineamientos del proyecto

/**
 * Preferencias de interfaz de usuario
 * - tipografía: familia y tamaño
 * - theme: claro/oscuro/sistema
 * - animaciones: on/off
 * - otros: futuros flags visuales
 */
export interface InterfacePreferences {
	/** Familia tipográfica seleccionada */
	fontFamily: 'system' | 'serif' | 'mono' | 'rounded';
	/** Tamaño base de fuente */
	fontSize: 'sm' | 'md' | 'lg';
	/** Tema visual */
	theme: 'light' | 'dark' | 'system';
	/** Animaciones habilitadas */
	animations: boolean;
	/** Respetar aspect ratio en modo grilla */
	thumbnailsRespectAspectRatio: boolean;
	/** Borde redondeado de thumbnails por modo */
	thumbnailsBorderRadius: {
		grid: number;
		card: number;
		mosaic: number;
	};
	/** Animaciones de thumbnails */
	thumbnailsAnimations: boolean;
	/** Modo ultra performance para thumbnails */
	thumbnailsUltraPerformance: boolean;
	/** Otros flags visuales futuros */
	[key: string]: unknown;
}

/**
 * Estado de settings de interfaz (persistente)
 */
export interface InterfaceSettingsState {
	preferences: InterfacePreferences;
	updatedAt: number;
}
