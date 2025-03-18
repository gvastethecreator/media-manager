import type { PrismaClient } from '@prisma/client';
import { seedLogger } from './utils.seed';

// Tipos de presets visuales por defecto
const DEFAULT_PRESETS = [
	// Preset genérico
	{
		name: 'default',
		description: 'Preset visual por defecto para todas las entidades',
		category: 'general',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['default', 'basic', 'clean']),
		colorConfig: JSON.stringify({
			primary: '#3b82f6',
			secondary: '#8b5cf6',
			accent: '#f59e0b',
		}),
		designConfig: JSON.stringify({
			preset: 'modern',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 2,
			shadowStyle: 'soft',
		}),
		layerConfig: JSON.stringify({
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'screen',
			layerSpacing: 2,
		}),
	},
	// Preset para carpetas
	{
		name: 'folder-default',
		description: 'Preset visual por defecto para carpetas',
		category: 'folder',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['folder', 'basic']),
		colorConfig: JSON.stringify({
			primary: '#3b82f6',
			secondary: '#60a5fa',
			accent: '#93c5fd',
		}),
		designConfig: JSON.stringify({
			preset: 'folder',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 2,
		}),
		folderConfig: JSON.stringify({
			layout: 'folder',
			showFileCount: true,
			showTotalSize: true,
			showLastUpdated: true,
			iconPosition: 'top-left',
			frameColor: '#3b82f6',
		}),
	},
	// Preset para álbumes
	{
		name: 'album-default',
		description: 'Preset visual por defecto para álbumes',
		category: 'album',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['album', 'gallery']),
		colorConfig: JSON.stringify({
			primary: '#2980b9',
			secondary: '#3498db',
			accent: '#5dade2',
		}),
		designConfig: JSON.stringify({
			preset: 'album',
			cornerStyle: 'rounded',
			aspectRatio: '4/5',
			elevation: 2,
		}),
		albumConfig: JSON.stringify({
			layout: 'album',
			showImageCount: true,
			showTags: true,
			showFilters: true,
			frameColor: '#2980b9',
		}),
	},
	// Preset para colecciones
	{
		name: 'collection-default',
		description: 'Preset visual por defecto para colecciones',
		category: 'collection',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['collection', 'set']),
		colorConfig: JSON.stringify({
			primary: '#c0392b',
			secondary: '#e74c3c',
			accent: '#ec7063',
		}),
		designConfig: JSON.stringify({
			preset: 'collection',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 3,
		}),
		collectionConfig: JSON.stringify({
			layout: 'collection',
			showImageCount: true,
			showPlatform: true,
			showPrice: true,
			showEditions: true,
			frameColor: '#c0392b',
		}),
	},
	// Preset para etiquetas
	{
		name: 'tag-default',
		description: 'Preset visual por defecto para etiquetas',
		category: 'tag',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['tag', 'label']),
		colorConfig: JSON.stringify({
			primary: '#16a085',
			secondary: '#1abc9c',
			accent: '#48c9b0',
		}),
		designConfig: JSON.stringify({
			preset: 'tag',
			cornerStyle: 'sharp',
			aspectRatio: '7/10',
			elevation: 2,
		}),
		tagConfig: JSON.stringify({
			layout: 'tag',
			showImageCount: true,
			showCategory: true,
			showRarity: true,
			frameColor: '#16a085',
		}),
	},
	// Preset para personajes
	{
		name: 'character-default',
		description: 'Preset visual por defecto para personajes',
		category: 'character',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['character', 'hero', 'person']),
		colorConfig: JSON.stringify({
			primary: '#d35400',
			secondary: '#e67e22',
			accent: '#f39c12',
		}),
		designConfig: JSON.stringify({
			preset: 'character',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 3,
		}),
		characterConfig: JSON.stringify({
			layout: 'character',
			showLevel: true,
			showClass: true,
			showRace: true,
			showAlignment: true,
			showStats: true,
			frameColor: '#d35400',
		}),
	},
	// Preset para lugares
	{
		name: 'place-default',
		description: 'Preset visual por defecto para lugares',
		category: 'place',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['place', 'location', 'map']),
		colorConfig: JSON.stringify({
			primary: '#1abc9c',
			secondary: '#16a085',
			accent: '#2ecc71',
		}),
		designConfig: JSON.stringify({
			preset: 'place',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 2,
		}),
		placeConfig: JSON.stringify({
			layout: 'place',
			showRegion: true,
			showClimate: true,
			showPopulation: true,
			showGovernment: true,
			frameColor: '#1abc9c',
		}),
	},
	// Preset para objetos del mundo
	{
		name: 'worldItem-default',
		description: 'Preset visual por defecto para objetos del mundo',
		category: 'worldItem',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['item', 'object', 'artifact']),
		colorConfig: JSON.stringify({
			primary: '#f39c12',
			secondary: '#f1c40f',
			accent: '#e67e22',
		}),
		designConfig: JSON.stringify({
			preset: 'worldItem',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 2,
		}),
		worldItemConfig: JSON.stringify({
			layout: 'worldItem',
			showType: true,
			showRarity: true,
			showOrigin: true,
			showProperties: true,
			frameColor: '#f39c12',
		}),
	},
	// Preset para conceptos
	{
		name: 'concept-default',
		description: 'Preset visual por defecto para conceptos',
		category: 'concept',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['concept', 'idea', 'brainstorm']),
		colorConfig: JSON.stringify({
			primary: '#3498db',
			secondary: '#2980b9',
			accent: '#1abc9c',
		}),
		designConfig: JSON.stringify({
			preset: 'concept',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 2,
		}),
		conceptConfig: JSON.stringify({
			layout: 'concept',
			showCategory: true,
			showTags: true,
			showRelations: true,
			frameColor: '#3498db',
		}),
	},
	// Preset para prompts
	{
		name: 'prompt-default',
		description: 'Preset visual por defecto para prompts',
		category: 'prompt',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['prompt', 'ai', 'generative']),
		colorConfig: JSON.stringify({
			primary: '#9b59b6',
			secondary: '#8e44ad',
			accent: '#e74c3c',
		}),
		designConfig: JSON.stringify({
			preset: 'prompt',
			cornerStyle: 'rounded',
			aspectRatio: '7/10',
			elevation: 2,
		}),
		promptConfig: JSON.stringify({
			layout: 'prompt',
			showCategory: true,
			showParameters: true,
			showTags: true,
			frameColor: '#9b59b6',
		}),
	},
	// Preset para notas
	{
		name: 'note-default',
		description: 'Preset visual por defecto para notas',
		category: 'note',
		isDefault: true,
		isPublic: true,
		version: '1.0.0',
		author: 'Sistema',
		tags: JSON.stringify(['note', 'text', 'document']),
		colorConfig: JSON.stringify({
			primary: '#f1c40f',
			secondary: '#f39c12',
			accent: '#e67e22',
		}),
		designConfig: JSON.stringify({
			preset: 'note',
			cornerStyle: 'rounded',
			aspectRatio: '4/5',
			elevation: 1,
		}),
		noteConfig: JSON.stringify({
			layout: 'note',
			showCategory: true,
			showPriority: true,
			showStatus: true,
			frameColor: '#f1c40f',
		}),
	},
];

export async function seedVisualPresets(prisma: PrismaClient) {
	try {
		seedLogger.info('🎭 Sembrando presets visuales...');

		// Sembrar los presets predeterminados
		const presets = await Promise.all(
			DEFAULT_PRESETS.map(async (preset) => {
				return prisma.visualPreset.upsert({
					where: { name: preset.name },
					update: preset,
					create: preset,
				});
			})
		);

		seedLogger.info(`✅ ${presets.length} presets visuales sembrados con éxito`);
		return presets;
	} catch (error) {
		seedLogger.error('❌ Error al sembrar presets visuales:', error);
		throw error;
	}
}
