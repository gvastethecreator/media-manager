import { afterEach, describe, expect, it, vi } from 'vitest';
import { enhancedDownloadService } from './download.service';

const originalFetch = globalThis.fetch;
const downloadItem = {
	entityType: 'image',
	id: 'image-1',
	name: 'sample.jpg',
};

afterEach(() => {
	globalThis.fetch = originalFetch;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('enhancedDownloadService', () => {
	it('downloads the authorized original without inventing an archive or PDF extension', async () => {
		const fetchMock = vi.fn(async () => new Response(new Blob(['image-bytes']), { status: 200 }));
		const createObjectURL = vi.fn(() => 'blob:download');
		const revokeObjectURL = vi.fn();
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
		globalThis.fetch = fetchMock as typeof fetch;
		vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

		const result = await enhancedDownloadService.downloadFile(downloadItem as never, {
			operationId: 'download-original',
			showProgress: false,
		});

		expect(result).toMatchObject({ filename: 'sample.jpg', success: true });
		expect(result.size).toBeGreaterThan(0);
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/download',
			expect.objectContaining({
				body: JSON.stringify({ asset: { assetId: 'image-1', assetType: 'image' } }),
				method: 'POST',
			})
		);
		expect(click).toHaveBeenCalledOnce();
		expect(createObjectURL).toHaveBeenCalledOnce();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
	});

	it('cancels the active authorized request using the caller operation ID', async () => {
		globalThis.fetch = vi.fn(
			async (_input: RequestInfo | URL, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), {
						once: true,
					});
				})
		) as typeof fetch;

		const pending = enhancedDownloadService.downloadFile(downloadItem as never, {
			operationId: 'download-cancelled',
			showProgress: false,
		});

		expect(enhancedDownloadService.cancelDownload('download-cancelled')).toBe(true);
		await expect(pending).resolves.toMatchObject({ error: 'Descarga cancelada.', success: false });
		expect(enhancedDownloadService.getActiveDownloadsCount()).toBe(0);
	});

	it('keeps batch downloads as one authorized original request per file', async () => {
		const fetchMock = vi.fn(async () => new Response(new Blob(['file-bytes']), { status: 200 }));
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
		globalThis.fetch = fetchMock as typeof fetch;
		vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:download'), revokeObjectURL: vi.fn() });

		const result = await enhancedDownloadService.downloadMultipleFiles(
			[downloadItem as never, { ...downloadItem, id: 'image-2', name: 'second.jpg' } as never],
			{ operationId: 'download-batch', showProgress: false }
		);

		expect(result).toMatchObject({ failedDownloads: 0, successfulDownloads: 2, totalFiles: 2, success: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(click).toHaveBeenCalledTimes(2);
	});
});
