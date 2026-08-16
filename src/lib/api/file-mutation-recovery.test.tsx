import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	fileMutationRecoveryKeys,
	useRetryFileMutationRecovery,
	useStartupFileMutationRecovery,
} from './file-mutation-recovery';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('startup file mutation recovery client', () => {
	it('reads only the safe startup recovery summary', async () => {
		let requestedUrl: RequestInfo | URL | undefined;
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			requestedUrl = input;
			return new Response(
				JSON.stringify({
					data: { recovery: { completed: 2, manual: 1, pending: 3, state: 'manual_review_required' } },
					success: true,
				}),
				{ headers: { 'Content-Type': 'application/json' }, status: 200 }
			);
		});
		vi.stubGlobal('fetch', fetchMock);
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useStartupFileMutationRecovery(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ completed: 2, manual: 1, pending: 3, state: 'manual_review_required' });
		if (!requestedUrl) {
			throw new Error('The recovery request did not run');
		}

		const url =
			typeof requestedUrl === 'string'
				? requestedUrl
				: requestedUrl instanceof URL
					? requestedUrl.href
					: requestedUrl.url;
		expect(new URL(url).pathname).toBe('/api/files/recovery-status');
	});

	it('requests an explicit recovery retry and updates the safe summary', async () => {
		const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
			expect(init?.method).toBe('POST');
			return new Response(
				JSON.stringify({
					data: { recovery: { completed: 1, manual: 0, pending: 0, state: 'resolved' } },
					success: true,
				}),
				{ headers: { 'Content-Type': 'application/json' }, status: 200 }
			);
		});
		vi.stubGlobal('fetch', fetchMock);
		const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
		const wrapper = ({ children }: PropsWithChildren) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useRetryFileMutationRecovery(), { wrapper });
		await act(async () => {
			await result.current.mutateAsync();
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/\/api\/files\/recovery\/reconcile$/),
			expect.objectContaining({ method: 'POST' })
		);
		expect(queryClient.getQueryData(fileMutationRecoveryKeys.startup)).toEqual({
			completed: 1,
			manual: 0,
			pending: 0,
			state: 'resolved',
		});
	});
});
