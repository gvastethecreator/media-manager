import {
	AIEngine,
	type AIEngineParser,
	type ComfyUIMetadata,
	type StructuredAIMetadata,
} from '@/types/metadata-origin.types';
import { parseComfyUIMetadata } from '../sd-parser.service';

export const comfyuiParser: AIEngineParser = {
	name: 'comfyui-parser',
	engines: [AIEngine.COMFYUI],
	priority: 90,
	matches(metadata) {
		// Indicadores: campo workflow, texto JSON con nodos, o presence de 'class_type'
		const wf = (metadata as any).workflow || (metadata as any).Workflow || (metadata as any).Comment;
		if (typeof wf === 'string') {
			if (wf.includes('"class_type"') || wf.includes('ComfyUI')) return true;
			try {
				const parsed = JSON.parse(wf);
				if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).nodes)) return true;
			} catch {}
		} else if (wf && typeof wf === 'object' && Array.isArray((wf as any).nodes)) return true;
		return false;
	},
	async parse(metadata) {
		const wf = (metadata as any).workflow || (metadata as any).Workflow || (metadata as any).Comment;
		if (!wf) return null;
		const res = await parseComfyUIMetadata(wf);
		if (!(res.detected && res.data)) return null;
		const data = res.data as ComfyUIMetadata;
		const legacy = { ...data };
		const { engine, ...rest } = data;
		const structured: StructuredAIMetadata = {
			engine,
			common: { engine, confidence: res.confidence, ...rest },
			comfyui: data,
			legacy_flat: legacy,
		};
		return structured;
	},
};
