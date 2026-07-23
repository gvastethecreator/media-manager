import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useThumbnail } from '@/hooks/use-thumbnail';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('useThumbnail', () => {
	it('shows an unavailable thumbnail without starting duplicate generation', async () => {
		const fetchMock = vi.fn(async () => new Response('<svg />', { status: 404 }));
		vi.stubGlobal('fetch', fetchMock);

		const { result } = renderHook(() => useThumbnail('image', 'image-1'));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current).toMatchObject({ error: 'Miniatura no disponible', exists: false, url: null });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/thumbnails/unified/image/image-1',
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
	});

	it('keeps an actionable HTTP error when manual generation returns a non-JSON response', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('<svg />', { status: 404 }))
			.mockResolvedValueOnce(new Response('upstream unavailable', { status: 503 }));
		vi.stubGlobal('fetch', fetchMock);

		const { result } = renderHook(() => useThumbnail('image', 'image-1'));

		await waitFor(() => expect(result.current.loading).toBe(false));
		await act(async () => {
			await result.current.generate();
		});

		await waitFor(() =>
			expect(result.current).toMatchObject({ error: 'Generation failed (HTTP 503)', exists: false, url: null })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			'/api/thumbnails/unified/generate',
			expect.objectContaining({ method: 'POST' })
		);
	});
});
