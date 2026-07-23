import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStartupFileMutationRecovery } from './file-mutation-recovery';

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
});
