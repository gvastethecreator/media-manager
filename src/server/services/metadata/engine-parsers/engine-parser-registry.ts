import { AIEngine, type AIEngineParser, type StructuredAIMetadata } from '@/types/metadata-origin.types';
import { automatic1111Parser } from './parser-automatic1111';
import { comfyuiParser } from './parser-comfyui';
import { midjourneyParser } from './parser-midjourney';
import { swarmuiParser } from './parser-swarmui';

const parsers: AIEngineParser[] = [automatic1111Parser, comfyuiParser, swarmuiParser, midjourneyParser];

// Ordenar por prioridad descendente
parsers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

export function getParserForEngine(engine: AIEngine): AIEngineParser | undefined {
	return parsers.find((p) => p.engines.includes(engine));
}

export async function runParsers(
	metadata: Record<string, unknown>,
	engineHint?: AIEngine
): Promise<StructuredAIMetadata | null> {
	// Si hay hint, intentar primero
	if (engineHint) {
		const hinted = getParserForEngine(engineHint);
		if (hinted && (await hinted.matches(metadata))) {
			const parsed = await hinted.parse(metadata);
			if (parsed) return parsed;
		}
	}
	// Recorrer todos
	for (const parser of parsers) {
		try {
			const matches = await parser.matches(metadata);
			if (!matches) continue;
			const parsed = await parser.parse(metadata);
			if (parsed) return parsed;
		} catch (e) {
			// Continuar con siguiente
		}
	}
	return null;
}

export function listRegisteredParsers(): string[] {
	return parsers.map((p) => `${p.name}(${p.engines.join(',')})`);
}
