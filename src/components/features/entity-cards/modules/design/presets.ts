'use client';

import { DEFAULT_DESIGN_SYSTEM } from './design-module';
import { DesignSystem, DesignSystemPreset } from './types';

/**
 * 🎨 Presets de diseño para las tarjetas de entidad
 */
export const DESIGN_PRESETS: DesignSystemPreset[] = [
	// Preset por defecto
	{
		id: 'default',
		name: 'Estándar',
		description: 'Diseño clásico y limpio con bordes suaves',
		designSystem: { ...DEFAULT_DESIGN_SYSTEM },
	},

	// Preset moderno con efecto de vidrio
	{
		id: 'glass',
		name: 'Cristal',
		description: 'Efecto de vidrio con fondo translúcido y desenfoque',
		designSystem: {
			...DEFAULT_DESIGN_SYSTEM,
			borderRadius: 16,
			backgroundColor: 'rgba(255, 255, 255, 0.15)',
			backgroundOpacity: 0.15,
			backdropFilter: 'blur',
			backdropBlurAmount: 8,
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: 'rgba(255, 255, 255, 0.2)',
			shadowColor: 'rgba(0, 0, 0, 0.12)',
			elevation: 3,
			glassEffect: true,
		},
	},

	// Preset minimalista
	{
		id: 'minimal',
		name: 'Minimalista',
		description: 'Diseño limpio y simple con bordes discretos',
		designSystem: {
			...DEFAULT_DESIGN_SYSTEM,
			borderRadius: 8,
			padding: 12,
			backgroundColor: '#ffffff',
			backgroundOpacity: 1,
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: '#e5e7eb',
			elevation: 1,
			shadowColor: 'rgba(0, 0, 0, 0.06)',
		},
	},

	// Preset neon
	{
		id: 'neon',
		name: 'Neón',
		description: 'Diseño con brillos de neón y contrastes fuertes',
		designSystem: {
			...DEFAULT_DESIGN_SYSTEM,
			borderRadius: 12,
			backgroundColor: '#0f172a',
			backgroundOpacity: 1,
			borderWidth: 2,
			borderStyle: 'solid',
			borderColor: '#4f46e5',
			accentColor: '#4f46e5',
			shadowColor: 'rgba(79, 70, 229, 0.5)',
			elevation: 4,
			textColor: '#f8fafc',
			customCssVariables: {
				'card-glow': '0 0 15px rgba(79, 70, 229, 0.7)',
				'card-highlight': 'rgba(79, 70, 229, 0.1)',
			},
		},
	},

	// Preset retro
	{
		id: 'retro',
		name: 'Retro',
		description: 'Estilo nostálgico con bordes pronunciados',
		designSystem: {
			...DEFAULT_DESIGN_SYSTEM,
			borderRadius: 0,
			backgroundColor: '#fef3c7',
			backgroundOpacity: 1,
			borderWidth: 3,
			borderStyle: 'solid',
			borderColor: '#b45309',
			padding: 20,
			accentColor: '#b45309',
			textColor: '#78350f',
			shadowColor: 'rgba(0, 0, 0, 0.3)',
			elevation: 2,
			customCssVariables: {
				'card-pattern': 'repeating-linear-gradient(45deg, #fbebb1 0px, #fbebb1 10px, #fef3c7 10px, #fef3c7 20px)',
			},
		},
	},

	// Preset para carpetas
	{
		id: 'folder',
		name: 'Carpeta',
		description: 'Diseño optimizado para representar carpetas',
		designSystem: {
			...DEFAULT_DESIGN_SYSTEM,
			borderRadius: 8,
			aspectRatio: '7/10',
			backgroundColor: '#fafafa',
			backgroundOpacity: 1,
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: '#e5e7eb',
			elevation: 2,
			shadowColor: 'rgba(0, 0, 0, 0.2)',
			accentColor: '#3b82f6',
			customCssVariables: {
				'folder-tab-height': '15px',
				'folder-tab-width': '40%',
			},
		},
	},

	// Preset para álbumes
	{
		id: 'album',
		name: 'Álbum',
		description: 'Diseño optimizado para representar álbumes de fotos',
		designSystem: {
			...DEFAULT_DESIGN_SYSTEM,
			borderRadius: 6,
			aspectRatio: '1/1',
			backgroundColor: '#ffffff',
			backgroundOpacity: 1,
			borderWidth: 8,
			borderStyle: 'solid',
			borderColor: '#ffffff',
			elevation: 3,
			shadowColor: 'rgba(0, 0, 0, 0.3)',
			padding: 0,
			customCssVariables: {
				'album-inner-shadow': 'inset 0 0 20px rgba(0, 0, 0, 0.1)',
				'album-spine': '5px solid #f1f5f9',
			},
		},
	},
];

/**
 * 🎨 Obtener un preset por su ID
 */
export function getPresetById(presetId: string): DesignSystemPreset | undefined {
	return DESIGN_PRESETS.find((preset) => preset.id === presetId);
}

/**
 * 🎨 Aplicar un preset al sistema de diseño actual
 */
export function applyPreset(presetId: string, currentDesign?: Partial<DesignSystem>): DesignSystem {
	const preset = getPresetById(presetId);

	if (!preset) {
		return {
			...DEFAULT_DESIGN_SYSTEM,
			...currentDesign,
		};
	}

	return {
		...preset.designSystem,
		...currentDesign,
	};
}
