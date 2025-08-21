import { describe, expect, it } from 'bun:test';
import { processFilesWithProgress } from '@/lib/filesystem/folder-stats';

// Stub minimal del mapper con delays controlados
class StubMapper {
	createBasicEntityFromFileCalls: string[] = [];
	extractMetadataForEntityCalls: string[] = [];
	processThumbnailForEntityCalls: string[] = [];

	getEntityTypeFromExtension() {
		return 'IMAGE';
	}
	async createBasicEntityFromFile(filePath: string, _folderId: string) {
		this.createBasicEntityFromFileCalls.push(filePath);
		await new Promise((r) => setTimeout(r, 5));
		return { success: true, entityType: 'IMAGE', entityId: `${filePath}:id` };
	}
	async extractMetadataForEntity(filePath: string, _id: string) {
		this.extractMetadataForEntityCalls.push(filePath);
		await new Promise((r) => setTimeout(r, 5));
		return { success: true };
	}
	async processThumbnailForEntity(filePath: string, _id: string) {
		this.processThumbnailForEntityCalls.push(filePath);
		await new Promise((r) => setTimeout(r, 5));
		return { success: true };
	}
}

describe('processFilesWithProgress', () => {
	it('emite progreso ordenado y no supera 99 antes de subcarpetas', async () => {
		const mapper = new StubMapper();
		const filePaths = Array.from({ length: 10 }, (_, i) => `f${i}.png`);
		const events: any[] = [];
		const stats = await processFilesWithProgress(filePaths, 'folder-test', mapper as any, true, {
			concurrency: 3,
			progressEmitter: (p: any): void => {
				events.push(p);
			},
		});
		expect(stats.totalFiles).toBe(10);
		expect(stats.failed).toBe(0);
		expect(stats.successful).toBe(10);
		expect(mapper.createBasicEntityFromFileCalls.length).toBe(10);
		expect(mapper.extractMetadataForEntityCalls.length).toBe(10);
		expect(mapper.processThumbnailForEntityCalls.length).toBe(10);
		// Aserciones sobre eventos
		expect(events.length).toBeGreaterThan(0);
		// Progreso siempre monotónico
		for (let i = 1; i < events.length; i++) {
			expect(events[i].progress).toBeGreaterThanOrEqual(events[i - 1].progress);
		}
		// Último evento antes de subcarpetas debe ser <= 99
		const maxBefore100 = events.reduce((acc, e) => Math.max(acc, e.progress), 0);
		expect(maxBefore100).toBeLessThanOrEqual(99);
		// Debe existir al menos un evento en cada fase esperada
		const phases = new Set(events.map((e) => e.phase));
		expect(phases.has('starting')).toBe(true);
		expect(phases.has('scanning')).toBe(true);
		expect(phases.has('metadata')).toBe(true);
		expect(phases.has('processing')).toBe(true);
	});

	it('maneja lista vacía sin emitir eventos (más allá del inicial si se pidiera)', async () => {
		const mapper = new StubMapper();
		const events: any[] = [];
		const stats = await processFilesWithProgress([], 'folder-test', mapper as any, true, {
			progressEmitter: (p: any): void => {
				events.push(p);
			},
		});
		expect(stats.totalFiles).toBe(0);
		expect(stats.processed).toBe(0);
		// Sin archivos no deben existir eventos (la función retorna pronto antes de emitir el inicial)
		expect(events.length).toBe(0);
	});

	it('procesa un único archivo con progresos consistentes', async () => {
		const mapper = new StubMapper();
		const events: any[] = [];
		const stats = await processFilesWithProgress(['single.png'], 'folder-test', mapper as any, true, {
			concurrency: 2,
			progressEmitter: (p: any): void => {
				events.push(p);
			},
		});
		expect(stats.totalFiles).toBe(1);
		expect(stats.successful).toBe(1);
		expect(events.length).toBeGreaterThanOrEqual(3); // starting + stage2 + stage3 (mínimo)
		const progresses = events.map((e) => e.progress);
		for (let i = 1; i < progresses.length; i++) {
			expect(progresses[i]).toBeGreaterThanOrEqual(progresses[i - 1]);
		}
		// 99 reserva, nunca debería faltar un valor <=99
		expect(Math.max(...progresses)).toBeLessThanOrEqual(99);
	});
});
