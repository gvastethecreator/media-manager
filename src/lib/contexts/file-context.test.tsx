import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook } from '@testing-library/react';
import { createElement, type PropsWithChildren, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileProvider, useFiles } from './file-context';

const originalFetch = globalThis.fetch;

const apiMocks = vi.hoisted(() => ({
	addEvent: vi.fn(),
	addTags: { mutate: vi.fn() },
	addToCollection: { mutate: vi.fn() },
	logActivity: { mutateAsync: vi.fn() },
	removeFromCollection: { mutate: vi.fn() },
	removeTags: { mutate: vi.fn() },
	toggleFavorite: { mutate: vi.fn() },
}));

vi.mock('@/lib/api/activity', () => ({
	useLogActivity: () => apiMocks.logActivity,
}));
vi.mock('@/lib/api/files', () => ({
	useAddTags: () => apiMocks.addTags,
	useAddToCollection: () => apiMocks.addToCollection,
	useRemoveFromCollection: () => apiMocks.removeFromCollection,
	useRemoveTags: () => apiMocks.removeTags,
	useToggleFavorite: () => apiMocks.toggleFavorite,
}));
vi.mock('@/lib/client/events.client', () => ({
	clientEvents: { useEvents: () => [{}, apiMocks.addEvent] },
}));

function wrapper({ children }: PropsWithChildren) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	return createElement(
		QueryClientProvider,
		{ client: queryClient },
		createElement(FileProvider, null, children)
	);
}

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe('FileProvider moveFiles', () => {
	it('posts authorized assets and a targetFolderId, never a filesystem path', async () => {
		const fetchMock = vi.fn(async () => {
			return new Response(
				JSON.stringify({
					data: { moved: [{ cleanupPending: false, recoveryPending: false }] },
					success: true,
				}),
				{ status: 200 }
			);
		});
		globalThis.fetch = fetchMock as typeof fetch;

		const { result } = renderHook(() => useFiles(), { wrapper });
		act(() => {
			result.current.setFiles([
				{
					entityType: 'image',
					id: 'image-1',
					name: 'one.png',
				} as never,
			]);
		});

		await act(async () => {
			await result.current.moveFiles(['image-1'], 'folder-target');
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/\/api\/files\/assets\/move$/),
			expect.objectContaining({
				body: JSON.stringify({
					assets: [{ assetId: 'image-1', assetType: 'image' }],
					targetFolderId: 'folder-target',
				}),
				method: 'POST',
			})
		);
		expect(JSON.stringify(fetchMock.mock.calls[0])).not.toMatch(/C:\\\\|\/Users\/|targetPath/);
		expect(result.current).not.toHaveProperty('copyFiles');
	});
});

describe('FileProvider context identity', () => {
	it('keeps the same value identity for two consumers across an unrelated parent rerender', () => {
		const seen: ReturnType<typeof useFiles>[] = [];
		let bumpParent: (() => void) | undefined;
		let bumpConsumer: (() => void) | undefined;

		function Parent({ children }: PropsWithChildren) {
			const [, setTick] = useState(0);
			bumpParent = () => setTick((tick) => tick + 1);
			return createElement(FileProvider, null, children);
		}

		function Probe({ trackRerender }: { trackRerender?: boolean }) {
			const [, setTick] = useState(0);
			if (trackRerender) {
				bumpConsumer = () => setTick((tick) => tick + 1);
			}
			seen.push(useFiles());
			return null;
		}

		const queryClient = new QueryClient({
			defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
		});
		render(
			createElement(
				QueryClientProvider,
				{ client: queryClient },
				createElement(
					Parent,
					null,
					createElement(Probe, { trackRerender: true }),
					createElement(Probe)
				)
			)
		);

		expect(seen).toHaveLength(2);
		expect(seen[0]).toBe(seen[1]);
		const firstValue = seen[0];

		act(() => {
			bumpParent?.();
		});
		expect(seen).toHaveLength(2);

		act(() => {
			bumpConsumer?.();
		});
		expect(seen).toHaveLength(3);
		expect(seen[2]).toBe(firstValue);
	});
});
