import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeNoteArtifactMetadata, useUpdateNote } from './notes';
import {
	createInlinePromptPayload,
	hydratePromptPortableFields,
	parsePromptArtifactParameters,
	serializePromptArtifactParametersForEditor,
	updateInlinePromptPayload,
	useDeletePrompt,
	useUpdatePrompt,
} from './prompts';
import { useDeleteNote } from './notes';
import { useCreateWildcard, useDeleteWildcard, useUpdateWildcard } from './wildcards';
import type { PromptWithStats } from '@/types/entities/prompt';
import { createFileBackedWildcard, getTaxonomyArtifactOrNull } from './taxonomy-artifacts';
import { queryClient as applicationQueryClient } from '@/lib/web/react-query';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

type TaxonomyDeleteInput = {
	contentHash?: string;
	deleteMissingConfirmed?: boolean;
	id: string;
	syncStatus?: 'conflict' | 'error' | 'external_change' | 'missing' | 'synced';
};

type TaxonomyDeleteHook = () => { mutateAsync(input: TaxonomyDeleteInput): Promise<void> };

type FileBackedUpdateCase = {
	data: (hash: string) => Record<string, unknown>;
	entity: Record<string, unknown>;
	entityType: 'note' | 'prompt' | 'wildcard';
	expectedMethods: Array<'GET' | 'PUT'>;
	hook: () => unknown;
	metadata: Record<string, unknown>;
};

async function expectFileBackedUpdateUsesPutProjection({
	data,
	entity,
	entityType,
	expectedMethods,
	hook,
	metadata,
}: FileBackedUpdateCase): Promise<void> {
	const entityId = `${entityType}-save`;
	const hash = 'b'.repeat(64);
	const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		const method = init?.method ?? 'GET';
		if (url.endsWith(`/api/taxonomy-artifacts/${entityType}/${entityId}`) && method === 'GET') {
			return Response.json({
				body: 'canonical body',
				byteSize: 14,
				contentHash: hash,
				entityId,
				entityType,
				metadata,
				relativePath: `taxonomy/${entityType}s/${entityId}.md`,
				rootId: 'root-1',
				syncStatus: 'synced',
			});
		}
		if (url.endsWith(`/api/taxonomy-artifacts/${entityType}/${entityId}`) && method === 'PUT') {
			return Response.json({
				body: 'canonical body',
				byteSize: 14,
				contentHash: hash,
				entity: { id: entityId, ...entity },
				entityId,
				entityType,
				metadata,
				relativePath: `taxonomy/${entityType}s/${entityId}.md`,
				rootId: 'root-1',
				syncStatus: 'synced',
			});
		}
		if (url.endsWith(`/api/${entityType}s/${entityId}`) && method === 'GET') {
			return Promise.reject(new Error('The GET after a confirmed PUT failed.'));
		}
		throw new Error(`Unexpected request: ${method} ${url}`);
	});
	vi.stubGlobal('fetch', fetchMock);
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: 3 }, queries: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children);
	const { result } = renderHook(hook, { wrapper });
	const mutation = result.current as {
		mutateAsync(input: { id: string; data: Record<string, unknown> }): Promise<unknown>;
	};

	let saved: unknown;
	await act(async () => {
		saved = await mutation.mutateAsync({ data: data(hash), id: entityId });
	});

	expect(saved).toMatchObject({ id: entityId });
	expect(fetchMock).toHaveBeenCalledTimes(expectedMethods.length);
	expect(fetchMock.mock.calls.map(([, init]) => init?.method ?? 'GET')).toEqual(expectedMethods);
	queryClient.clear();
}

async function expectObservedDeleteUsesCas(
	hook: TaxonomyDeleteHook,
	entityType: 'note' | 'prompt' | 'wildcard'
): Promise<void> {
	const hash = 'a'.repeat(64);
	const entityId = `${entityType}-stale`;
	const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
		async (_input, _init) =>
			new Response(JSON.stringify({ code: 'ARTIFACT_CONFLICT', message: 'external edit', retryable: false }), {
				headers: { 'Content-Type': 'application/json' },
				status: 409,
			})
	);
	vi.stubGlobal('fetch', fetchMock);
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children);
	const { result } = renderHook(hook, { wrapper });
	let thrown: unknown;
	await act(async () => {
		try {
			await result.current.mutateAsync({ contentHash: hash, id: entityId, syncStatus: 'synced' });
		} catch (error) {
			thrown = error;
		}
	});

	expect(thrown).toMatchObject({ code: 'ARTIFACT_CONFLICT', status: 409 });
	expect(fetchMock).toHaveBeenCalledOnce();
	const call = fetchMock.mock.calls[0];
	if (!call) throw new Error('The delete did not issue a request.');
	const [request, init] = call;
	expect(String(request)).toContain(`/api/taxonomy-artifacts/${entityType}/${entityId}`);
	expect(init).toMatchObject({ method: 'DELETE' });
	expect(JSON.parse(String(init?.body))).toEqual({ deleteMissing: false, expectedHash: hash });
	queryClient.clear();
}

describe('taxonomy artifact client contracts', () => {
	it('sets application mutations to single-shot by default', () => {
		expect(applicationQueryClient.getDefaultOptions().mutations?.retry).toBe(false);
	});

	it('sends the UI-observed Prompt hash and surfaces a stale external edit without an internal GET', async () => {
		await expectObservedDeleteUsesCas(useDeletePrompt, 'prompt');
	});

	it('sends the UI-observed Note hash and surfaces a stale external edit without an internal GET', async () => {
		await expectObservedDeleteUsesCas(useDeleteNote, 'note');
	});

	it('sends the UI-observed Wildcard hash and surfaces a stale external edit without an internal GET', async () => {
		await expectObservedDeleteUsesCas(useDeleteWildcard, 'wildcard');
	});

	it('keeps a response-lost file-backed Wildcard create single-shot and reports an uncertain result', async () => {
		const fetchMock = vi.fn(async () => Promise.reject(new Error('connection dropped')));
		vi.stubGlobal('fetch', fetchMock);
		const queryClient = new QueryClient({
			defaultOptions: { mutations: { retry: 3 }, queries: { retry: false } },
		});
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children);
		const { result } = renderHook(() => useCreateWildcard(), { wrapper });
		let thrown: unknown;
		await act(async () => {
			try {
				await result.current.mutateAsync({
					fileBacking: { body: 'rojo\nverde', rootId: 'root-1' },
					name: 'Palette',
				});
			} catch (error) {
				thrown = error;
			}
		});

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain('Wildcard creation was not confirmed');
		expect(fetchMock).toHaveBeenCalledOnce();
		queryClient.clear();
	});

	it('treats each confirmed file-backed PUT as success when the old secondary entity GET would fail', async () => {
		await expectFileBackedUpdateUsesPutProjection({
			data: (hash) => ({
				content: 'updated prompt',
				fileBacking: { expectedHash: hash },
				name: 'Prompt saved',
				parameters: '[]',
				purpose: 'Saved',
			}),
			entity: { content: 'updated prompt', name: 'Prompt saved' },
			entityType: 'prompt',
			expectedMethods: ['GET', 'PUT'],
			hook: useUpdatePrompt,
			metadata: { parameters: [], purpose: 'Saved', title: 'Prompt saved' },
		});
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		await expectFileBackedUpdateUsesPutProjection({
			data: (hash) => ({ content: 'updated note', fileBacking: { expectedHash: hash }, title: 'Note saved' }),
			entity: { content: 'updated note', title: 'Note saved' },
			entityType: 'note',
			expectedMethods: ['GET', 'PUT'],
			hook: useUpdateNote,
			metadata: { title: 'Note saved' },
		});
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		await expectFileBackedUpdateUsesPutProjection({
			data: (hash) => ({
				fileBacking: { body: 'canonical body', expectedHash: hash, rootId: 'root-1' },
				name: 'Wildcard saved',
			}),
			entity: { name: 'Wildcard saved' },
			entityType: 'wildcard',
			expectedMethods: ['PUT'],
			hook: useUpdateWildcard,
			metadata: { title: 'Wildcard saved' },
		});
	});

	it('strips update-only recovery fields from file-backed Wildcard creation', async () => {
		const fetchMock = vi.fn(
			async (_input: RequestInfo | URL, _init?: RequestInit) =>
				new Response(JSON.stringify({ artifact: {}, entity: { id: 'wild-1' } }), {
					headers: { 'Content-Type': 'application/json' },
					status: 201,
				})
		);
		vi.stubGlobal('fetch', fetchMock);

		await createFileBackedWildcard({
			body: 'one',
			metadata: { title: 'wild-1' },
			rootId: 'root-1',
			// Guard against wider objects reaching this boundary through spreads.
			restoreMissing: false,
		} as Parameters<typeof createFileBackedWildcard>[0] & { restoreMissing: boolean });

		const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(requestBody).toEqual({
			body: 'one',
			metadata: { title: 'wild-1' },
			rootId: 'root-1',
		});
	});

	it('returns null only for a typed 404 and propagates other API failures', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response('{"code":"ARTIFACT_NOT_FOUND","message":"missing"}', {
						headers: { 'Content-Type': 'application/json' },
						status: 404,
					})
			)
		);
		await expect(getTaxonomyArtifactOrNull('note', 'missing-note')).resolves.toBeNull();

		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response('{"message":"HTTP 404 appears in text"}', {
						headers: { 'Content-Type': 'application/json' },
						status: 500,
					})
			)
		);
		await expect(getTaxonomyArtifactOrNull('note', 'broken-note')).rejects.toMatchObject({ status: 500 });
	});

	it('preserves authored Note metadata that the editor did not replace', () => {
		expect(
			mergeNoteArtifactMetadata(
				{ content: 'updated', title: 'Updated' },
				{
					category: 'research',
					color: 'var(--entity-note)',
					emoji: '🧭',
					summary: 'Keep me',
					title: 'Original',
				}
			)
		).toEqual({
			category: 'research',
			color: 'var(--entity-note)',
			emoji: '🧭',
			summary: 'Keep me',
			title: 'Updated',
		});
	});

	it('uses edited Prompt parameters and rejects non-list JSON', () => {
		const edited = [{ custom: true, key: 'subject', type: 'text' }] as const;
		expect(parsePromptArtifactParameters(JSON.stringify(edited), [])).toEqual(edited);
		expect(() => parsePromptArtifactParameters('{}', [])).toThrow('JSON array');
		expect(() => parsePromptArtifactParameters('not-json', [])).toThrow('valid JSON');
	});

	it('renders missing file-backed Prompt parameters as the canonical empty list', () => {
		expect(serializePromptArtifactParametersForEditor(undefined)).toBe('[]');
	});

	it('round-trips inline Prompt parameters and purpose through the metadata projection', () => {
		const parameters = JSON.stringify([{ custom: false, key: 'subject', type: 'text' }]);
		const payload = createInlinePromptPayload({
			content: 'Prompt body',
			model: 'gpt-4',
			name: 'Round trip',
			parameters,
			purpose: 'Preserve editor state',
		});
		const hydrated = hydratePromptPortableFields({
			content: payload.content,
			metadata: payload.metadata,
			name: payload.name,
			type: payload.type,
		} as unknown as PromptWithStats);

		expect(hydrated).toMatchObject({
			content: 'Prompt body',
			model: 'gpt-4',
			parameters,
			purpose: 'Preserve editor state',
		});
	});

	it('preserves untouched and unknown inline Prompt metadata during partial updates', () => {
		const existingMetadata = JSON.stringify({
			parameters: [{ key: 'subject', type: 'text' }],
			purpose: 'Original purpose',
			source: 'legacy-import',
		});

		const purposePayload = updateInlinePromptPayload({ purpose: 'Updated purpose' }, existingMetadata);
		expect(JSON.parse(String(purposePayload.metadata))).toEqual({
			parameters: [{ key: 'subject', type: 'text' }],
			purpose: 'Updated purpose',
			source: 'legacy-import',
		});

		const parametersPayload = updateInlinePromptPayload({ parameters: '[]' }, existingMetadata);
		expect(JSON.parse(String(parametersPayload.metadata))).toEqual({
			parameters: [],
			purpose: 'Original purpose',
			source: 'legacy-import',
		});
	});

	it('blocks partial inline Prompt metadata updates when the stored JSON is corrupt', () => {
		expect(() => updateInlinePromptPayload({ purpose: 'Updated purpose' }, '{broken')).toThrow(
			'current prompt metadata'
		);
	});

	it('loads current inline Prompt metadata before sending a partial portable-field update', async () => {
		const existingMetadata = JSON.stringify({
			parameters: [{ key: 'subject', type: 'text' }],
			purpose: 'Original purpose',
			source: 'legacy-import',
		});
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			const method = init?.method ?? 'GET';
			if (url.endsWith('/api/taxonomy-artifacts/prompt/prompt-1')) {
				return new Response('{"code":"ARTIFACT_NOT_FOUND","message":"missing"}', {
					headers: { 'Content-Type': 'application/json' },
					status: 404,
				});
			}
			if (url.endsWith('/api/prompts/prompt-1') && method === 'GET') {
				return Response.json({ id: 'prompt-1', metadata: existingMetadata, name: 'Prompt' });
			}
			if (url.endsWith('/api/prompts/prompt-1') && method === 'PUT') {
				const body = JSON.parse(String(init?.body));
				return Response.json({ id: 'prompt-1', metadata: body.metadata, name: 'Prompt' });
			}
			throw new Error(`Unexpected request: ${method} ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);
		const queryClient = new QueryClient({
			defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
		});
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children);
		const { result } = renderHook(() => useUpdatePrompt(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({ id: 'prompt-1', data: { purpose: 'Updated purpose' } });
		});

		const promptCalls = fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/api/prompts/prompt-1'));
		expect(promptCalls.map(([, init]) => init?.method)).toEqual(['GET', 'PUT']);
		const requestBody = JSON.parse(String(promptCalls[1]?.[1]?.body));
		expect(JSON.parse(requestBody.metadata)).toEqual({
			parameters: [{ key: 'subject', type: 'text' }],
			purpose: 'Updated purpose',
			source: 'legacy-import',
		});
		queryClient.clear();
	});
});
