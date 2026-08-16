import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, type PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PartialFileMutationError } from '@/lib/api/file-mutation-result';
import { moveAuthorizedAssets, useMove } from './use-move';

const originalFetch = globalThis.fetch;
const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));

vi.mock('@/components/ui/use-toast', () => ({
	useToast: () => ({ toast: toastMock }),
}));

function queryWrapper({ children }: PropsWithChildren) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	return createElement(QueryClientProvider, { client: queryClient }, children);
}

afterEach(() => {
	globalThis.fetch = originalFetch;
	toastMock.mockReset();
	vi.restoreAllMocks();
});

describe('moveAuthorizedAssets', () => {
	it('uses one authorized mutation per asset and retains pending recovery counts', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: { moved: [{ cleanupPending: false, recoveryPending: false }] },
						success: true,
					}),
					{ status: 200 }
				)
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: { moved: [{ cleanupPending: true, recoveryPending: true }] },
						success: true,
					}),
					{ status: 200 }
				)
			);
		globalThis.fetch = fetchMock as typeof fetch;

		const summary = await moveAuthorizedAssets({
			assets: [
				{ assetId: 'image-1', assetType: 'image' },
				{ assetId: 'document-1', assetType: 'document' },
			],
			targetFolderId: 'folder-target',
		});

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			expect.stringMatching(/\/api\/files\/assets\/move$/),
			expect.objectContaining({
				body: JSON.stringify({
					assets: [{ assetId: 'image-1', assetType: 'image' }],
					targetFolderId: 'folder-target',
				}),
				method: 'POST',
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			expect.stringMatching(/\/api\/files\/assets\/move$/),
			expect.objectContaining({
				body: JSON.stringify({
					assets: [{ assetId: 'document-1', assetType: 'document' }],
					targetFolderId: 'folder-target',
				}),
				method: 'POST',
			})
		);
		expect(summary).toEqual({
			applied: 2,
			cleanupPending: 1,
			reconciliationPending: 1,
			recoveryPending: 1,
			total: 2,
		});
	});

	it('stops after a rejected asset and reports exactly what already changed', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: { moved: [{ cleanupPending: false, recoveryPending: false }] },
						success: true,
					}),
					{ status: 200 }
				)
			)
			.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Destino ocupado' }), { status: 409 }));
		globalThis.fetch = fetchMock as typeof fetch;

		await expect(
			moveAuthorizedAssets({
				assets: [
					{ assetId: 'image-1', assetType: 'image' },
					{ assetId: 'image-2', assetType: 'image' },
					{ assetId: 'image-3', assetType: 'image' },
				],
				targetFolderId: 'folder-target',
			})
		).rejects.toMatchObject({
			name: 'PartialFileMutationError',
			summary: { applied: 1, total: 3 },
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('reindexes a changed destination and explains a partial move in the visible error', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: { moved: [{ cleanupPending: true, recoveryPending: false }] },
						success: true,
					}),
					{ status: 200 }
				)
			)
			.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Destino ocupado' }), { status: 409 }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));
		globalThis.fetch = fetchMock as typeof fetch;

		const { result } = renderHook(() => useMove(), { wrapper: queryWrapper });

		await expect(
			result.current.moveFiles({
				assets: [
					{ assetId: 'image-1', assetType: 'image' },
					{ assetId: 'image-2', assetType: 'image' },
				],
				targetFolderId: 'folder-target',
			})
		).rejects.toBeInstanceOf(PartialFileMutationError);

		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			expect.stringMatching(/\/api\/folders\/folder-target\/reindex$/),
			expect.objectContaining({ method: 'POST' })
		);
		expect(toastMock).toHaveBeenCalledWith(
			expect.objectContaining({
				description: expect.stringContaining('1 de 2 archivos fueron movidos antes del fallo.'),
				title: '⚠️ Movimiento parcialmente aplicado',
				variant: 'destructive',
			})
		);
		expect(toastMock.mock.calls[0][0].description).toContain('1 operación queda pendiente de reconciliación.');
	});
});
