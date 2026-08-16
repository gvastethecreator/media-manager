import { serverLogger } from '@/lib/logger/server-logger';
import { PromptCategory } from '@/types/entities/prompt/enums';

const categoriesLogger = serverLogger.withContext('PromptCategories');

/**
 * Interfaz para metadatos de categoría de prompt
 */
export interface PromptCategoryMetadata {
	color: string;
	description: string;
	icon: string;
	id: PromptCategory;
	name: string;
	order: number;
}

/**
 * Metadatos completos para las categorías de prompts
 */
export const PROMPT_CATEGORIES: Record<PromptCategory, PromptCategoryMetadata> = {
	[PromptCategory.GENERAL]: {
		id: PromptCategory.GENERAL,
		name: 'General',
		description: 'General-purpose and commonly used prompts',
		icon: '🌐',
		color: 'var(--preset-indigo)',
		order: 0,
	},
	[PromptCategory.TEXT]: {
		id: PromptCategory.TEXT,
		name: 'Texto',
		description: 'Text generation and manipulation, summaries, and rewriting',
		icon: '📝',
		color: 'var(--preset-green)',
		order: 1,
	},
	[PromptCategory.IMAGE]: {
		id: PromptCategory.IMAGE,
		name: 'Imagen',
		description: 'Prompts for describing and analyzing images',
		icon: '🖼️',
		color: 'var(--dt-danger-500)',
		order: 2,
	},
	[PromptCategory.CODE]: {
		id: PromptCategory.CODE,
		name: 'Código',
		description: 'Programming code generation and analysis',
		icon: '👨‍💻',
		color: 'var(--dt-primary-500)',
		order: 3,
	},
	[PromptCategory.CREATIVE]: {
		id: PromptCategory.CREATIVE,
		name: 'Creativo',
		description: 'Prompts for creative content and storytelling',
		icon: '🎨',
		color: 'var(--preset-pink)',
		order: 4,
	},
	[PromptCategory.CHARACTER]: {
		id: PromptCategory.CHARACTER,
		name: 'Personajes',
		description: 'Character creation and development',
		icon: '👤',
		color: 'var(--preset-orange)',
		order: 5,
	},
	[PromptCategory.WORLDBUILDING]: {
		id: PromptCategory.WORLDBUILDING,
		name: 'Worldbuilding',
		description: 'World, setting, and atmosphere creation',
		icon: '🌍',
		color: 'var(--preset-purple)',
		order: 6,
	},
	[PromptCategory.ASSISTANT]: {
		id: PromptCategory.ASSISTANT,
		name: 'Asistente',
		description: 'Prompts for creating specialized virtual assistants',
		icon: '🤖',
		color: 'var(--preset-sky)',
		order: 7,
	},
	[PromptCategory.SYSTEM]: {
		id: PromptCategory.SYSTEM,
		name: 'Sistema',
		description: 'Prompts reservados para uso del sistema',
		icon: '⚙️',
		color: 'var(--dt-neutral-500)',
		order: 8,
	},
	[PromptCategory.AUDIO]: {
		id: PromptCategory.AUDIO,
		name: 'Audio',
		description: 'Prompts focused on audio generation and analysis',
		icon: '🎵',
		color: 'var(--preset-sky)',
		order: 9,
	},
	[PromptCategory.VIDEO]: {
		id: PromptCategory.VIDEO,
		name: 'Video',
		description: 'Prompts for video or animation',
		icon: '🎬',
		color: '#fb923c',
		order: 10,
	},
	[PromptCategory.CHAT]: {
		id: PromptCategory.CHAT,
		name: 'Chat',
		description: 'Prompts para conversaciones o chatbots',
		icon: '💬',
		color: 'var(--dt-success-500)',
		order: 11,
	},
	[PromptCategory.SETTING]: {
		id: PromptCategory.SETTING,
		name: 'Entorno',
		description: 'Setting and location creation',
		icon: '🏞️',
		color: 'var(--preset-lime)',
		order: 12,
	},
	[PromptCategory.STORY]: {
		id: PromptCategory.STORY,
		name: 'Historia',
		description: 'Desarrollo de tramas y narrativas',
		icon: '📖',
		color: '#f472b6',
		order: 13,
	},
	[PromptCategory.UNCLASSIFIED]: {
		id: PromptCategory.UNCLASSIFIED,
		name: 'Sin clasificar',
		description: 'Prompts without a specific category',
		icon: '❔',
		color: 'var(--dt-neutral-400)',
		order: 14,
	},
	[PromptCategory.OTHER]: {
		id: PromptCategory.OTHER,
		name: 'Otros',
		description: 'Miscellaneous prompt categories',
		icon: '📦',
		color: '#a855f7',
		order: 15,
	},
};

/**
 * Obtiene metadatos de una categoría por su ID
 * @param categoryId ID de la categoría
 * @returns Metadatos de la categoría o undefined si no existe
 */
export function getCategoryMetadata(categoryId: PromptCategory | string): PromptCategoryMetadata | undefined {
	try {
		return PROMPT_CATEGORIES[categoryId as PromptCategory];
	} catch (error) {
		categoriesLogger.error('❌ Could not get category metadata:', error);
		return;
	}
}

/**
 * Obtiene todas las categorías ordenadas
 * @returns Array de categorías ordenadas
 */
export function getAllCategories(): PromptCategoryMetadata[] {
	try {
		return Object.values(PROMPT_CATEGORIES).sort((a, b) => a.order - b.order);
	} catch (error) {
		categoriesLogger.error('❌ Could not get all categories:', error);
		return [];
	}
}

/**
 * Obtiene las categorías visibles para el usuario final
 * (excluyendo categorías de sistema u otras ocultas)
 * @returns Array de categorías visibles ordenadas
 */
export function getUserVisibleCategories(): PromptCategoryMetadata[] {
	try {
		return Object.values(PROMPT_CATEGORIES)
			.filter((category) => category.id !== PromptCategory.SYSTEM)
			.sort((a, b) => a.order - b.order);
	} catch (error) {
		categoriesLogger.error('❌ Could not get visible categories:', error);
		return [];
	}
}

/**
 * Determina si una categoría es válida
 * @param categoryId ID de la categoría a validar
 * @returns true si la categoría existe
 */
export function isValidCategory(categoryId: string | PromptCategory): boolean {
	try {
		return Object.values(PromptCategory).includes(categoryId as PromptCategory);
	} catch (error) {
		categoriesLogger.error('❌ Could not validate category:', error);
		return false;
	}
}

/**
 * Obtiene una categoría por defecto
 * @returns Categoría general como valor por defecto
 */
export function getDefaultCategory(): PromptCategory {
	return PromptCategory.GENERAL;
}

/**
 * Obtiene el nombre legible de una categoría
 * @param categoryId ID de la categoría
 * @returns Nombre legible o el mismo ID si no se encuentra
 */
export function getCategoryName(categoryId: string | PromptCategory): string {
	try {
		const category = getCategoryMetadata(categoryId);
		return category?.name || String(categoryId);
	} catch (error) {
		categoriesLogger.error('❌ Could not get category name:', error);
		return String(categoryId);
	}
}

/**
 * Agrupa prompts por categoría
 * @param prompts Array de prompts a agrupar
 * @returns Mapa de prompts agrupados por categoría
 */
export function groupPromptsByCategory<T extends { category: string | PromptCategory }>(
	prompts: T[]
): Record<string, T[]> {
	try {
		const grouped: Record<string, T[]> = {};

		// Inicializar con categorías vacías
		for (const category of Object.values(PromptCategory)) {
			grouped[category] = [];
		}

		// Agrupar prompts
		for (const prompt of prompts) {
			const category = prompt.category as string;
			// Si la categoría no es válida, agrupar en "Sin clasificar"
			const validCategory = Object.values(PromptCategory).includes(category as PromptCategory)
				? category
				: PromptCategory.UNCLASSIFIED;
			grouped[validCategory].push(prompt);
		}

		return grouped;
	} catch (error) {
		categoriesLogger.error('❌ Could not group prompts by category:', error);
		return {};
	}
}
