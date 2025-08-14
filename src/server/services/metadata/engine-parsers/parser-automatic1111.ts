import {
	AIEngine,
	type AIEngineParser,
	type Automatic1111Metadata,
	type StructuredAIMetadata,
} from '@/types/metadata-origin.types';
import { parseAutomatic1111Metadata } from '../sd-parser.service';

// Parser modular para Automatic1111 / Forge
export const automatic1111Parser: AIEngineParser = {
	name: 'automatic1111-parser',
	engines: [AIEngine.AUTOMATIC1111, AIEngine.FORGE],
	priority: 100,
	matches(metadata) {
		// Señales típicas: presencia de tokens de parámetros o software hints
		const textFields = [
			'parameters',
			'Parameters',
			'Comment',
			'Description',
			'UserComment',
			'Software',
			'ImageDescription',
		];
		const indicator = ['Steps:', 'Sampler:', 'CFG scale', 'CFG Scale', 'Seed:', 'Model:'];
		for (const f of textFields) {
			const val = (metadata as any)[f];
			if (typeof val === 'string') {
				let hits = 0;
				for (const tok of indicator) {
					if (val.includes(tok)) {
						hits++;
						if (hits >= 2) return true;
					}
				}
			}
		}
		return false;
	},
	async parse(metadata) {
		// Reusar findParametersText heurística mínima local
		const fields = [
			'parameters',
			'Parameters',
			'Comment',
			'Description',
			'UserComment',
			'Software',
			'ImageDescription',
		];
		let candidate: string | null = null;
		for (const f of fields) {
			const val = (metadata as any)[f];
			if (typeof val === 'string' && /Steps:\s*\d+/.test(val)) {
				candidate = val;
				break;
			}
		}
		if (!candidate) return null;
		const res = await parseAutomatic1111Metadata(candidate);
		if (!(res.detected && res.data)) return null;
		const data = res.data as Automatic1111Metadata;
		const legacy = { ...data };
		const { engine, ...rest } = data;
		const structured: StructuredAIMetadata = {
			engine,
			common: { engine, confidence: res.confidence, ...rest },
			automatic1111: data,
			legacy_flat: legacy,
		};
		return structured;
	},
};
