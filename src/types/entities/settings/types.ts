// src/types/entities/settings/types.ts
// Tipos canónicos para preferencias de interfaz de usuario
// 📝 Documentado según lineamientos del proyecto

/**
 * ⚙️ Tipos canónicos para la entidad Settings
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 *
 * Nota: Los tipos InterfacePreferences e InterfaceSettingsState son auxiliares para UI y no forman parte del modelo de BD.
 */

export interface SettingsBase {
	id: string;
	theme: string;
	language: string;
	data: unknown; // Json
	profileId: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export type SettingsCreateInput = Omit<SettingsBase, 'id' | 'createdAt' | 'updatedAt'>;
export type SettingsUpdateInput = Partial<Omit<SettingsBase, 'id'>>;

// --- Tipos auxiliares para UI (no usar en lógica de negocio principal) ---

/**
 * Preferencias de interfaz de usuario (UI)
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

export interface InterfaceSettingsState {
	preferences: InterfacePreferences;
	updatedAt: number;
}
