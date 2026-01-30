import {
	AIEngine,
	type AIEngineParser,
	type AIGenerationParameters,
	type StructuredAIMetadata,
} from '@/types/metadata-origin.types';

// Placeholder simple para Midjourney
export const midjourneyParser: AIEngineParser = {
	name: 'midjourney-parser',
	engines: [AIEngine.MIDJOURNEY],
	priority: 10,
	matches(metadata) {
		// Heurísticas básicas: prompt que contenga '--v ' o '--stylize' o referencia a Midjourney
		const candidates = ['prompt', 'Prompt', 'Comment', 'Description'];
		for (const c of candidates) {
			const val = (metadata as any)[c];
			if (typeof val === 'string' && /(midjourney|--v\s+\d|--stylize|--s\s+\d+)/i.test(val)) return true;
		}
		return false;
	},
	async parse(metadata) {
		const prompt = (metadata as any).prompt || (metadata as any).Prompt || undefined;
		if (!prompt) return null;
		const legacy: AIGenerationParameters = { prompt };
		const structured: StructuredAIMetadata = {
			engine: AIEngine.MIDJOURNEY,
			common: { engine: AIEngine.MIDJOURNEY, prompt, confidence: 0.3 },
			midjourney: { engine: AIEngine.MIDJOURNEY, prompt },
			legacy_flat: legacy,
			warnings: ['Parser midjourney placeholder (resultado parcial)'],
		};
		return structured;
	},
};
