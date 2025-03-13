'use client';

/**
 * Tipo para información de generación de IA
 */
export interface AIGenerationInfo {
	type?: string;
	prompt?: string;
	model?: string;
	sampler?: string;
	negative_prompt?: string;
	steps?: number;
	cfg_scale?: number;
	cfg?: number;
	seed?: number;
	scheduler?: string;
	clip_skip?: number | string;
	workflow?: string;
	extra_params?: Record<string, unknown>;
	[key: string]: unknown;
}

/**
 * Determina el tipo de generador a partir de la información de generación
 */
export function determineGeneratorType(generation?: AIGenerationInfo): {
	type: string;
	className: string;
	fullName: string;
} {
	if (!generation || !generation.type) {
		return {
			type: 'unknown',
			className: 'bg-gray-500/10 text-gray-500',
			fullName: 'Desconocido',
		};
	}

	const type = String(generation.type).toLowerCase();

	if (type.includes('stable-diffusion') || type === 'sd' || type === 'a1111') {
		return {
			type: 'sd',
			className: 'bg-blue-500/10 text-blue-500',
			fullName: 'Stable Diffusion',
		};
	}
	if (type.includes('comfyui') || type === 'comfy') {
		return {
			type: 'comfyui',
			className: 'bg-green-500/10 text-green-500',
			fullName: 'ComfyUI',
		};
	}
	if (type.includes('invoke') || type === 'invoke-ai') {
		return {
			type: 'invokeai',
			className: 'bg-purple-500/10 text-purple-500',
			fullName: 'InvokeAI',
		};
	}
	if (type.includes('novel') || type === 'novel-ai') {
		return {
			type: 'novelai',
			className: 'bg-pink-500/10 text-pink-500',
			fullName: 'NovelAI',
		};
	}
	if (type.includes('midjourney') || type === 'mj') {
		return {
			type: 'midjourney',
			className: 'bg-indigo-500/10 text-indigo-500',
			fullName: 'Midjourney',
		};
	}
	if (type.includes('dalle') || type.includes('dall-e')) {
		return {
			type: 'dalle',
			className: 'bg-orange-500/10 text-orange-500',
			fullName: 'DALL-E',
		};
	}

	return {
		type: String(generation.type),
		className: 'bg-gray-500/10 text-gray-500',
		fullName: String(generation.type),
	};
}

/**
 * Intenta encontrar información de generación por IA en el objeto metadata
 */
export function findGenerationInfo(metadata: Record<string, unknown>): AIGenerationInfo | null {
	// Si ya tiene generación, usarla
	if (metadata.generation) {
		return metadata.generation as AIGenerationInfo;
	}

	// Buscar ai (alias común)
	if (metadata.ai) {
		return metadata.ai as AIGenerationInfo;
	}

	// Campos que indican información de generación
	const generationIndicators = ['prompt', 'model', 'sampler', 'negative_prompt', 'steps', 'cfg_scale', 'seed'];

	// Verificar campos directamente en metadata
	const directFields = generationIndicators.filter((field) => field in metadata);
	if (directFields.length >= 2) {
		// Parece contener información de generación directamente
		const generation: AIGenerationInfo = { type: 'unknown' };

		// Copiar los campos relevantes
		for (const field of generationIndicators) {
			if (metadata[field] !== undefined) {
				generation[field] = metadata[field];
			}
		}

		return generation;
	}

	// Buscar en subobjetos de primer nivel
	for (const key in metadata) {
		if (typeof metadata[key] === 'object' && metadata[key] !== null) {
			const obj = metadata[key] as Record<string, unknown>;

			// Ver si este objeto parece ser de generación
			const subFields = generationIndicators.filter((field) => field in obj);
			if (subFields.length >= 2) {
				// Este subobjeto parece contener información de generación
				const generation: AIGenerationInfo = { type: key };

				// Copiar los campos relevantes
				for (const field of generationIndicators) {
					if (obj[field] !== undefined) {
						generation[field] = obj[field];
					}
				}

				return generation;
			}
		}
	}

	// No se encontró información de generación
	return null;
}
