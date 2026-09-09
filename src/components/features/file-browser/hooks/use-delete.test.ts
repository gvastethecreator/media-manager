import { afterEach, describe, expect, it, vi } from 'vitest';
import { PartialFileMutationError } from '@/lib/api/file-mutation-result';
import { deleteBrowserItems } from './use-delete';

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
	vi.restoreAllMocks();
});

describe('deleteBrowserItems', () => {
	it('keeps media batch deletes and records each legacy delete in order', async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
		globalThis.fetch = fetchMock as typeof fetch;

		const result = await deleteBrowserItems([
			{ entityType: 'image', id: 'image-1', name: 'one.jpg' },
			{ entityType: 'image', id: 'image-2', name: 'two.jpg' },
			{ entityType: 'document', id: 'document-1', name: 'notes.pdf' },
		]);

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			new URL('/api/images/batch', window.location.origin).toString(),
			expect.objectContaining({ body: JSON.stringify({ ids: ['image-1', 'image-2'] }), method: 'DELETE' })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			new URL('/api/documents/document-1', window.location.origin).toString(),
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(result).toMatchObject({ applied: 3, total: 3 });
	});

	it('stops after a legacy delete fails and reports the applied subset', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Documento bloqueado' }), { status: 409 }));
		globalThis.fetch = fetchMock as typeof fetch;

		let failure: unknown;
		try {
			await deleteBrowserItems([
				{ entityType: 'document', id: 'document-1', name: 'one.pdf' },
				{ entityType: 'document', id: 'document-2', name: 'two.pdf' },
				{ entityType: 'jsonFile', id: 'json-1', name: 'data.json' },
			]);
		} catch (error) {
			failure = error;
		}

		expect(failure).toBeInstanceOf(PartialFileMutationError);
		expect(failure).toMatchObject({
			name: 'PartialFileMutationError',
			summary: { applied: 1, total: 3 },
		});
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			new URL('/api/documents/document-1', window.location.origin).toString(),
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			new URL('/api/documents/document-2', window.location.origin).toString(),
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
