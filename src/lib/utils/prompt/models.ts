import { serverLogger } from '@/lib/logger/server-logger';
import { PromptModel } from '@/types/entities/prompt/enums';

const modelsLogger = serverLogger.withContext('PromptModels');

/**
 * Interfaz para metadatos de modelo de IA
 */
export interface AIModelMetadata {
	apiVersionRequired?: string;
	contextSize: number;
	description: string;
	icon: string;
	id: PromptModel;
	isAvailable: boolean;
	maxTokens: number;
	name: string;
	order: number;
	provider: string;
	supports: {
		images: boolean;
		code: boolean;
		functions: boolean;
		assistants: boolean;
	};
}

/**
 * Metadatos completos para los modelos de IA
 */
export const AI_MODELS: Record<PromptModel, AIModelMetadata> = {
	[PromptModel.GPT_3_5]: {
		id: PromptModel.GPT_3_5,
		name: 'GPT-3.5 Turbo',
		provider: 'OpenAI',
		description: 'Modelo balanceado de OpenAI con buen rendimiento y bajo costo',
		icon: '🤖',
		maxTokens: 4096,
		supports: {
			images: true,
			code: true,
			functions: true,
			assistants: true,
		},
		contextSize: 16_385,
		order: 1,
		isAvailable: true,
	},
	[PromptModel.GPT_4]: {
		id: PromptModel.GPT_4,
		name: 'GPT-4',
		provider: 'OpenAI',
		description: 'Modelo avanzado de OpenAI con alta capacidad de razonamiento',
		icon: '🧠',
		maxTokens: 8192,
		supports: {
			images: true,
			code: true,
			functions: true,
			assistants: true,
		},
		contextSize: 8192,
		order: 2,
		isAvailable: true,
	},
	[PromptModel.GPT4_VISION]: {
		id: PromptModel.GPT4_VISION,
		name: 'GPT-4 Vision',
		provider: 'OpenAI',
		description: 'OpenAI model with vision capabilities',
		icon: '👁️',
		maxTokens: 4096,
		supports: {
			images: true,
			code: true,
			functions: true,
			assistants: true,
		},
		contextSize: 128_000,
		order: 3,
		isAvailable: true,
	},
	[PromptModel.GPT_4_TURBO]: {
		id: PromptModel.GPT_4_TURBO,
		name: 'GPT-4 Turbo',
		provider: 'OpenAI',
		description: 'Improved GPT-4 version with greater speed and context',
		icon: '⚡',
		maxTokens: 4096,
		supports: {
			images: true,
			code: true,
			functions: true,
			assistants: true,
		},
		contextSize: 128_000,
		order: 4,
		isAvailable: true,
	},
	[PromptModel.CLAUDE_INSTANT]: {
		id: PromptModel.CLAUDE_INSTANT,
		name: 'Claude Instant',
		provider: 'Anthropic',
		description: 'Fast Anthropic model for short responses',
		icon: '🔮',
		maxTokens: 4096,
		supports: {
			images: false,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 100_000,
		order: 5,
		isAvailable: false,
	},
	[PromptModel.CLAUDE_2]: {
		id: PromptModel.CLAUDE_2,
		name: 'Claude 2',
		provider: 'Anthropic',
		description: 'Modelo de razonamiento avanzado de Anthropic',
		icon: '🧩',
		maxTokens: 4096,
		supports: {
			images: false,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 100_000,
		order: 6,
		isAvailable: false,
	},
	[PromptModel.CLAUDE_3_OPUS]: {
		id: PromptModel.CLAUDE_3_OPUS,
		name: 'Claude 3 Opus',
		provider: 'Anthropic',
		description: 'More capable Anthropic model with advanced features',
		icon: '🎭',
		maxTokens: 4096,
		supports: {
			images: true,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 200_000,
		order: 7,
		isAvailable: true,
	},
	[PromptModel.CLAUDE_3_SONNET]: {
		id: PromptModel.CLAUDE_3_SONNET,
		name: 'Claude 3 Sonnet',
		provider: 'Anthropic',
		description: 'Modelo intermedio de Claude 3 con buen rendimiento general',
		icon: '📜',
		maxTokens: 4096,
		supports: {
			images: true,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 200_000,
		order: 8,
		isAvailable: true,
	},
	[PromptModel.CLAUDE_3_HAIKU]: {
		id: PromptModel.CLAUDE_3_HAIKU,
		name: 'Claude 3 Haiku',
		provider: 'Anthropic',
		description: 'Faster, lighter Claude 3 model',
		icon: '🎋',
		maxTokens: 4096,
		supports: {
			images: true,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 200_000,
		order: 9,
		isAvailable: true,
	},
	[PromptModel.LLAMA_3_8B]: {
		id: PromptModel.LLAMA_3_8B,
		name: 'Llama 3 8B',
		provider: 'Meta',
		description: 'Modelo de Meta optimizado para rendimiento eficiente',
		icon: '🦙',
		maxTokens: 4096,
		supports: {
			images: false,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 8192,
		order: 10,
		isAvailable: false,
	},
	[PromptModel.LLAMA_3_70B]: {
		id: PromptModel.LLAMA_3_70B,
		name: 'Llama 3 70B',
		provider: 'Meta',
		description: 'Largest Meta model with strong reasoning capabilities',
		icon: '🦙',
		maxTokens: 4096,
		supports: {
			images: false,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 8192,
		order: 11,
		isAvailable: false,
	},
	[PromptModel.GEMINI_PRO]: {
		id: PromptModel.GEMINI_PRO,
		name: 'Gemini Pro',
		provider: 'Google',
		description: 'Modelo multimodal de Google con buen rendimiento general',
		icon: '💎',
		maxTokens: 8192,
		supports: {
			images: true,
			code: true,
			functions: true,
			assistants: false,
		},
		contextSize: 32_768,
		order: 12,
		isAvailable: false,
	},
	[PromptModel.GEMINI_FLASH]: {
		id: PromptModel.GEMINI_FLASH,
		name: 'Gemini Flash',
		provider: 'Google',
		description: 'Fast Google model for efficient responses',
		icon: '⚡',
		maxTokens: 8192,
		supports: {
			images: true,
			code: true,
			functions: true,
			assistants: false,
		},
		contextSize: 16_384,
		order: 13,
		isAvailable: false,
	},
	[PromptModel.MISTRAL_7B]: {
		id: PromptModel.MISTRAL_7B,
		name: 'Mistral 7B',
		provider: 'Mistral AI',
		description: 'Efficient Mistral AI model with a strong performance-to-cost ratio',
		icon: '🌀',
		maxTokens: 4096,
		supports: {
			images: false,
			code: true,
			functions: false,
			assistants: false,
		},
		contextSize: 8192,
		order: 14,
		isAvailable: false,
	},
	[PromptModel.CUSTOM]: {
		id: PromptModel.CUSTOM,
		name: 'Personalizado',
		provider: 'Custom',
		description: 'Modelo personalizado configurable por el usuario',
		icon: '🛠️',
		maxTokens: 4096,
		supports: {
			images: false,
			code: false,
			functions: false,
			assistants: false,
		},
		contextSize: 4096,
		order: 99,
		isAvailable: true,
	},
};

/**
 * Obtiene metadatos de un modelo por su ID
 * @param modelId ID del modelo
 * @returns Metadatos del modelo o undefined si no existe
 */
export function getModelMetadata(modelId: PromptModel | string): AIModelMetadata | undefined {
	try {
		return AI_MODELS[modelId as PromptModel];
	} catch (error) {
		modelsLogger.error('❌ Could not get model metadata:', error);
		return;
	}
}

/**
 * Obtiene todos los modelos ordenados
 * @returns Array de modelos ordenados
 */
export function getAllModels(): AIModelMetadata[] {
	try {
		return Object.values(AI_MODELS).sort((a, b) => a.order - b.order);
	} catch (error) {
		modelsLogger.error('❌ Could not get all models:', error);
		return [];
	}
}

/**
 * Obtiene solo los modelos disponibles
 * @returns Array de modelos disponibles ordenados
 */
export function getAvailableModels(): AIModelMetadata[] {
	try {
		return Object.values(AI_MODELS)
			.filter((model) => model.isAvailable)
			.sort((a, b) => a.order - b.order);
	} catch (error) {
		modelsLogger.error('❌ Could not get available models:', error);
		return [];
	}
}

/**
 * Obtiene modelos filtrados por proveedor
 * @param provider Nombre del proveedor
 * @returns Array de modelos del proveedor
 */
export function getModelsByProvider(provider: string): AIModelMetadata[] {
	try {
		return Object.values(AI_MODELS)
			.filter((model) => model.provider.toLowerCase() === provider.toLowerCase())
			.sort((a, b) => a.order - b.order);
	} catch (error) {
		modelsLogger.error('❌ Could not get models by provider:', error);
		return [];
	}
}

/**
 * Determina si un modelo es válido
 * @param modelId ID del modelo a validar
 * @returns true si el modelo existe
 */
export function isValidModel(modelId: string | PromptModel): boolean {
	try {
		return Object.values(PromptModel).includes(modelId as PromptModel);
	} catch (error) {
		modelsLogger.error('❌ Error al validar modelo:', error);
		return false;
	}
}

/**
 * Obtiene un modelo por defecto
 * @returns Modelo GPT-3.5 como valor por defecto
 */
export function getDefaultModel(): PromptModel {
	return PromptModel.GPT_3_5;
}

/**
 * Obtiene el nombre legible de un modelo
 * @param modelId ID del modelo
 * @returns Nombre legible o el mismo ID si no se encuentra
 */
export function getModelName(modelId: string | PromptModel): string {
	try {
		const model = getModelMetadata(modelId);
		return model?.name || String(modelId);
	} catch (error) {
		modelsLogger.error('❌ Could not get model name:', error);
		return String(modelId);
	}
}

/**
 * Verifica si un modelo soporta una característica específica
 * @param modelId ID del modelo
 * @param feature Característica a verificar
 * @returns true si el modelo soporta la característica
 */
export function modelSupportsFeature(
	modelId: string | PromptModel,
	feature: keyof AIModelMetadata['supports']
): boolean {
	try {
		const model = getModelMetadata(modelId);
		return Boolean(model?.supports[feature]);
	} catch (error) {
		modelsLogger.error('❌ Could not verify feature support:', error);
		return false;
	}
}
