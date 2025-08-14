import { describe, expect, it } from 'bun:test';
import { runParsers } from '@/server/services/metadata/engine-parsers/engine-parser-registry';
import { AIEngine, type StructuredAIMetadata } from '@/types/metadata-origin.types';

function buildA1111MetadataBlock(overrides: Partial<Record<string, string>> = {}): string {
	const base =
		'A majestic castle on a hill at sunrise\nNegative prompt: low quality, blurry, watermark\nSteps: 28, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 123456789, Model: epicrealismXL_v10, Clip skip: 2';
	if (!Object.keys(overrides).length) return base;
	let modified = base;
	for (const [k, v] of Object.entries(overrides)) {
		const regex = new RegExp(`${k}: [^,\n]+`);
		modified = modified.replace(regex, `${k}: ${v}`);
	}
	return modified;
}

const comfyWorkflow = {
	last_node_id: 15,
	last_link_id: 25,
	nodes: [
		{ id: 1, type: 'CLIPTextEncode', widgets_values: ['A serene landscape with mountains'], outputs: ['CONDITIONING'] },
		{ id: 2, type: 'CLIPTextEncode', widgets_values: ['low quality, blurry'], outputs: ['CONDITIONING'] },
		{ id: 5, type: 'KSampler', widgets_values: [123_456_789, 30, 7, 'euler', 'karras'] },
		{ id: 8, type: 'CheckpointLoaderSimple', widgets_values: ['realisticVisionV51.safetensors'] },
	],
	links: [],
};

function buildComfyWrapped(): Record<string, unknown> {
	return {
		workflow: JSON.stringify(comfyWorkflow),
	};
}

describe('Engine Parsers - Automatic1111', () => {
	it('detecta y parsea un bloque de parámetros A1111', async () => {
		const metadata: Record<string, unknown> = { parameters: buildA1111MetadataBlock() };
		const parsed = (await runParsers(metadata, AIEngine.AUTOMATIC1111)) as StructuredAIMetadata | null;
		expect(parsed).toBeTruthy();
		expect(parsed?.engine).toBe(AIEngine.AUTOMATIC1111);
		expect(parsed?.automatic1111?.steps).toBe(28);
		expect(parsed?.automatic1111?.sampler).toContain('DPM');
		expect(parsed?.legacy_flat?.steps).toBe(28);
		expect(parsed?.common.confidence).toBeGreaterThan(0.3);
	});

	it('no retorna resultado si faltan tokens clave', async () => {
		const bad = { parameters: 'Just a plain caption without technical params' };
		const parsed = await runParsers(bad, AIEngine.AUTOMATIC1111);
		expect(parsed).toBeNull();
	});
});

describe('Engine Parsers - ComfyUI', () => {
	it('detecta workflow JSON y extrae parámetros clave', async () => {
		const metadata = buildComfyWrapped();
		const parsed = (await runParsers(metadata, AIEngine.COMFYUI)) as StructuredAIMetadata | null;
		expect(parsed).toBeTruthy();
		expect(parsed?.engine).toBe(AIEngine.COMFYUI);
		expect(parsed?.comfyui?.prompt).toContain('serene landscape');
		expect(parsed?.comfyui?.negative_prompt).toContain('low quality');
		expect(parsed?.comfyui?.steps).toBe(30);
		expect(parsed?.comfyui?.sampler).toBe('euler');
		expect(parsed?.legacy_flat?.steps).toBe(30);
	});

	it('retorna null si workflow inválido', async () => {
		const metadata = { workflow: '{ invalid json' };
		const parsed = await runParsers(metadata, AIEngine.COMFYUI);
		expect(parsed).toBeNull();
	});
});

describe('Engine Parsers - Prioridad', () => {
	it('usa hint de engine y evita otros parsers', async () => {
		const meta = { parameters: buildA1111MetadataBlock(), workflow: JSON.stringify(comfyWorkflow) }; // contiene ambos
		const parsed = await runParsers(meta, AIEngine.AUTOMATIC1111);
		expect(parsed?.engine).toBe(AIEngine.AUTOMATIC1111);
	});
});
