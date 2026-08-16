import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiClientError, ApiTransportError, shouldRetryApiError, shouldRetryApiRequest } from './client';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('ApiClient response and mutation contracts', () => {
	it('sends DELETE bodies and treats 204 as a successful void response', async () => {
		const fetchMock = vi.fn(
			async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 204 })
		);
		vi.stubGlobal('fetch', fetchMock);
		const client = new ApiClient({ timeout: 1_000 });

		await expect(
			client.delete<void>('/taxonomy-artifacts/note/note-1', { expectedHash: 'a'.repeat(64) })
		).resolves.toBe(undefined);
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			body: JSON.stringify({ expectedHash: 'a'.repeat(64) }),
			method: 'DELETE',
		});
	});

	it('clears the timeout when fetch rejects', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Promise.reject(new Error('offline')))
		);
		const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
		const client = new ApiClient({ timeout: 1_000 });

		await expect(client.get('/probe')).rejects.toThrow('offline');
		expect(clearTimeoutSpy).toHaveBeenCalledOnce();
	});

	it('preserves structured HTTP status and error codes for UI state decisions', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(JSON.stringify({ code: 'AUTHORIZED_SCOPE_REQUIRED', message: 'Scope required' }), {
						headers: { 'Content-Type': 'application/json' },
						status: 410,
					})
			)
		);
		const client = new ApiClient({ timeout: 1_000 });
		const error = await client.get('/stats').catch((caught) => caught);
		expect(error).toBeInstanceOf(ApiClientError);
		expect(error).toMatchObject({ code: 'AUTHORIZED_SCOPE_REQUIRED', status: 410 });
	});

	it('never writes request or response payloads to the client console', async () => {
		const requestSecret = 'private-authored-request';
		const responseSecret = 'private-authored-response';
		const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(JSON.stringify({ code: 'ARTIFACT_CONFLICT', message: responseSecret }), {
						headers: { 'Content-Type': 'application/json' },
						status: 409,
					})
			)
		);
		const client = new ApiClient({ timeout: 1_000 });

		await expect(client.post('/taxonomy-artifacts/note/note-1', { body: requestSecret })).rejects.toMatchObject({
			code: 'ARTIFACT_CONFLICT',
			status: 409,
		});
		const consoleOutput = JSON.stringify([...info.mock.calls, ...warn.mock.calls]);
		expect(consoleOutput).not.toContain(requestSecret);
		expect(consoleOutput).not.toContain(responseSecret);
		expect(consoleOutput).toContain('/taxonomy-artifacts/note/note-1');
	});

	it('retries only transport and transient HTTP failures within the configured budget', () => {
		expect(shouldRetryApiError(0, new ApiTransportError('offline'), 1)).toBe(true);
		expect(shouldRetryApiError(1, new ApiTransportError('offline'), 1)).toBe(false);
		expect(shouldRetryApiError(0, new ApiClientError(503, 'busy', {}), 1)).toBe(true);
		expect(shouldRetryApiError(0, new ApiClientError(409, 'conflict', { retryable: false }), 1)).toBe(false);
		expect(shouldRetryApiError(0, new Error('client validation'), 1)).toBe(false);
	});

	it('allows automatic replay only for safe reads or an explicit idempotent POST contract', () => {
		const transient = new ApiTransportError('offline');
		expect(shouldRetryApiRequest('GET', undefined, 0, transient, 1)).toBe(true);
		expect(shouldRetryApiRequest('POST', undefined, 0, transient, 1)).toBe(false);
		expect(shouldRetryApiRequest('POST', { idempotencyKey: 'wildcard-request-1' }, 0, transient, 1)).toBe(true);
		expect(shouldRetryApiRequest('PUT', { idempotencyKey: 'unused' }, 0, transient, 1)).toBe(false);
		expect(shouldRetryApiRequest('DELETE', { idempotencyKey: 'unused' }, 0, transient, 1)).toBe(false);
	});

	it('does not replay ambiguous mutations even when a caller configures retry attempts', async () => {
		const fetchMock = vi.fn(async () => Promise.reject(new Error('offline')));
		vi.stubGlobal('fetch', fetchMock);
		const client = new ApiClient({ timeout: 1_000 });

		await expect(
			client.post('/taxonomy-artifacts/wildcard', { body: 'one' }, { retryAttempts: 1 })
		).rejects.toBeInstanceOf(ApiTransportError);
		await expect(
			client.put('/taxonomy-artifacts/note/note-1', { body: 'one' }, { idempotencyKey: 'unused', retryAttempts: 1 })
		).rejects.toBeInstanceOf(ApiTransportError);
		await expect(
			client.delete('/taxonomy-artifacts/note/note-1', { expectedHash: 'a'.repeat(64) }, { retryAttempts: 1 })
		).rejects.toBeInstanceOf(ApiTransportError);

		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('replays a transient GET only within an explicit retry budget', async () => {
		const fetchMock = vi
			.fn<() => Promise<Response>>()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(Response.json({ ok: true }));
		vi.stubGlobal('fetch', fetchMock);
		const client = new ApiClient({ timeout: 1_000 });

		await expect(client.get<{ ok: boolean }>('/probe', { retryAttempts: 1 })).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
