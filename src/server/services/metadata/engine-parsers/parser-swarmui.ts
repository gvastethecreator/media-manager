import {
	AIEngine,
	type AIEngineParser,
	type StructuredAIMetadata,
	type SwarmUIMetadata,
} from '@/types/metadata-origin.types';
import { parseSwarmUIMetadata } from '../sd-parser.service';

export const swarmuiParser: AIEngineParser = {
	name: 'swarmui-parser',
	engines: [AIEngine.SWARMUI],
	priority: 80,
	matches(metadata) {
		// SwarmUI produce campos estructurados como generation_time, prep_time, aspect_ratio
		const keys = Object.keys(metadata || {});
		const signals = ['generation_time', 'prep_time', 'aspect_ratio', 'gpu_memory'];
		return signals.some((s) => keys.includes(s));
	},
	async parse(metadata) {
		const res = await parseSwarmUIMetadata(metadata as any);
		if (!(res.detected && res.data)) return null;
		const data = res.data as SwarmUIMetadata;
		const legacy = { ...data };
		const { engine, ...rest } = data;
		const structured: StructuredAIMetadata = {
			engine,
			common: { engine, confidence: res.confidence, ...rest },
			swarmui: data,
			legacy_flat: legacy,
		};
		return structured;
	},
};
