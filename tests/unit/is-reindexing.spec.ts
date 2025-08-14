import { computeIsReindexing } from '@/components/settings/folders/utils/is-reindexing';
import { describe, expect, it } from 'bun:test';

const base = {
	processStatus: undefined as any,
	isGloballyProcessing: false,
	globalCurrentFolderId: null as string | null,
	isProcessingFlag: false,
};

describe('computeIsReindexing', () => {
	it('retorna false cuando status completed para la carpeta', () => {
		const res = computeIsReindexing({
			...base,
			folderId: 'A',
			processStatus: {
				folderId: 'A',
				isProcessing: false,
				progress: 100,
				phase: 'complete',
				status: 'completed',
			} as any,
		});
		expect(res).toBe(false);
	});

	it('retorna true cuando isProcessing true y misma carpeta', () => {
		const res = computeIsReindexing({
			...base,
			folderId: 'A',
			processStatus: { folderId: 'A', isProcessing: true } as any,
		});
		expect(res).toBe(true);
	});

	it('usa globalCurrentFolderId durante reindex global', () => {
		const res = computeIsReindexing({
			...base,
			folderId: 'B',
			processStatus: { folderId: 'X', isProcessing: true } as any,
			isGloballyProcessing: true,
			globalCurrentFolderId: 'B',
		});
		expect(res).toBe(true);
	});

	it('retorna false para otra carpeta en global', () => {
		const res = computeIsReindexing({
			...base,
			folderId: 'C',
			processStatus: { folderId: 'X', isProcessing: true } as any,
			isGloballyProcessing: true,
			globalCurrentFolderId: 'B',
		});
		expect(res).toBe(false);
	});
});
