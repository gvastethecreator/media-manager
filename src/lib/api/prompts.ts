import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageWithStats } from '@/types/entities/image';
import type { PromptWithStats } from '@/types/entities/prompt';
import { apiClient } from './client';
import { invalidateNavigationData } from './navigation';
import {
	deleteTaxonomyArtifact,
	getTaxonomyArtifactOrNull,
	saveTaxonomyArtifact,
	type TaxonomyArtifactDocument,
	type TaxonomyArtifactParameter,
} from './taxonomy-artifacts';

export function parsePromptArtifactParameters(
	value: string | null | undefined,
	fallback: TaxonomyArtifactParameter[] | undefined
): TaxonomyArtifactParameter[] | undefined {
	if (value == null) return fallback;
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new Error('Prompt parameters must be valid JSON.');
	}
	if (!Array.isArray(parsed)) throw new Error('Prompt parameters must be a JSON array.');
	return parsed as TaxonomyArtifactParameter[];
}

export function serializePromptArtifactParametersForEditor(
	parameters: TaxonomyArtifactParameter[] | undefined
): string {
	return JSON.stringify(parameters ?? []);
}

interface PromptPortableMetadata {
	parameters?: TaxonomyArtifactParameter[];
	purpose?: string | null;
}

function parsePromptPortableMetadata(value: unknown): PromptPortableMetadata {
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		const candidate = parsed as PromptPortableMetadata;
		return {
			parameters: Array.isArray(candidate.parameters) ? candidate.parameters : undefined,
			purpose: typeof candidate.purpose === 'string' || candidate.purpose === null ? candidate.purpose : undefined,
		};
	} catch {
		return {};
	}
}

function parseInlinePromptMetadataForUpdate(value: unknown): Record<string, unknown> {
	if (value == null) return {};

	let parsed: unknown;
	try {
		parsed = typeof value === 'string' ? JSON.parse(value) : value;
	} catch {
		throw new Error(
			'The current prompt metadata does not contain valid JSON. Fix the record before editing it.'
		);
	}

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error(
			'Los metadatos actuales del Prompt deben ser un objeto JSON. Corrige el registro antes de editarlo.'
		);
	}

	return { ...(parsed as Record<string, unknown>) };
}

export function hydratePromptPortableFields<T extends PromptWithStats>(prompt: T): T {
	const transport = prompt as T & { metadata?: unknown; model?: string | null; type?: string | null };
	const metadata = parsePromptPortableMetadata(transport.metadata);
	return {
		...prompt,
		model: transport.model ?? transport.type ?? null,
		parameters: prompt.parameters ?? serializePromptArtifactParametersForEditor(metadata.parameters),
		purpose: prompt.purpose ?? metadata.purpose ?? null,
	};
}

export interface PromptFilters {
	category?: string;
	composition?: string;
	content?: string;
	featuredImage?: string;
	inspiration?: string;
	isFavorite?: boolean;
	isPublic?: boolean;
	lighting?: string;
	limit?: number;
	mood?: string;
	notes?: string;
	offset?: number;
	parameters?: string;
	parentId?: string;
	search?: string;
	sortBy?:
		| 'name'
		| 'createdAt'
		| 'updatedAt'
		| 'totalImages'
		| 'totalVideos'
		| 'type'
		| 'content'
		| 'parameters'
		| 'style'
		| 'mood'
		| 'lighting'
		| 'composition'
		| 'technique'
		| 'inspiration'
		| 'notes'
		| 'featuredImage'
		| 'parentId';
	sortOrder?: 'asc' | 'desc';
	style?: string;
	technique?: string;
	type?: string;
}

export interface PromptCreateInput {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	inspiration?: string | null;
	isPublic?: boolean;
	lighting?: string | null;
	mood?: string | null;
	model?: string | null;
	name: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	purpose?: string | null;
	style?: string | null;
	technique?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
}

export function createInlinePromptPayload(data: PromptCreateInput): Record<string, unknown> {
	const { model, parameters, purpose, ...inlineData } = data;
	return {
		...inlineData,
		metadata: JSON.stringify({
			parameters: parsePromptArtifactParameters(parameters, []) ?? [],
			purpose: purpose ?? null,
		}),
		...(model !== undefined ? { type: model } : {}),
	};
}

export interface PromptUpdateInput {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	inspiration?: string | null;
	isPublic?: boolean;
	lighting?: string | null;
	mood?: string | null;
	model?: string | null;
	name?: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	purpose?: string | null;
	style?: string | null;
	technique?: string | null;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
}

export function updateInlinePromptPayload(
	data: PromptUpdateInput,
	existingMetadata?: unknown
): Record<string, unknown> {
	const { model, parameters, purpose, ...inlineData } = data;
	const updatesPortableMetadata = parameters !== undefined || purpose !== undefined;
	const mergedMetadata = updatesPortableMetadata
		? {
				...parseInlinePromptMetadataForUpdate(existingMetadata),
				...(parameters !== undefined
					? { parameters: parameters === null ? [] : (parsePromptArtifactParameters(parameters, []) ?? []) }
					: {}),
				...(purpose !== undefined ? { purpose } : {}),
			}
		: undefined;
	return {
		...inlineData,
		...(mergedMetadata ? { metadata: JSON.stringify(mergedMetadata) } : {}),
		...(model !== undefined ? { type: model } : {}),
	};
}

export type PromptUpdateMutationInput = PromptUpdateInput & {
	fileBacking?: { expectedHash: string; restoreMissing?: boolean };
};

export interface PromptDeleteMutationInput {
	/** Hash observed by the UI before it begins a destructive action. */
	contentHash?: string;
	deleteMissingConfirmed?: boolean;
	id: string;
	syncStatus?: TaxonomyArtifactDocument['syncStatus'];
}

export interface PromptsResponse {
	data: PromptWithStats[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Query keys
export const promptKeys = {
	all: ['prompts'] as const,
	lists: () => [...promptKeys.all, 'list'] as const,
	list: (filters: PromptFilters) => [...promptKeys.lists(), filters] as const,
	details: () => [...promptKeys.all, 'detail'] as const,
	detail: (id: string) => [...promptKeys.details(), id] as const,
	images: (id: string) => [...promptKeys.detail(id), 'images'] as const,
};

// Hooks
export function usePrompts(filters: PromptFilters = {}) {
	return useQuery<PromptsResponse, Error>({
		queryKey: promptKeys.list(filters),
		queryFn: async () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.append(key, String(value));
				}
			}
			const response = await apiClient.get<PromptsResponse>(`/prompts?${params.toString()}`);
			return { ...response, data: response.data.map(hydratePromptPortableFields) };
		},
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePrompt(id: string) {
	return useQuery<PromptWithStats, Error>({
		queryKey: promptKeys.detail(id),
		queryFn: async () => hydratePromptPortableFields(await apiClient.get<PromptWithStats>(`/prompts/${id}`)),
		enabled: !!id,
		staleTime: 1000 * 60, // 1 minuto
	});
}

export function usePromptImages(id: string) {
	return useQuery<ImageWithStats[], Error>({
		queryKey: promptKeys.images(id),
		queryFn: () => apiClient.get<ImageWithStats[]>(`/prompts/${id}/images`),
		enabled: !!id,
		staleTime: 1000 * 30, // 30 segundos
	});
}

export function useCreatePrompt() {
	const queryClient = useQueryClient();

	return useMutation<PromptWithStats, Error, PromptCreateInput>({
		mutationFn: async (data) =>
			hydratePromptPortableFields(await apiClient.post<PromptWithStats>('/prompts', createInlinePromptPayload(data))),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
			void invalidateNavigationData(queryClient);
		},
	});
}

export function useUpdatePrompt() {
	const queryClient = useQueryClient();

	return useMutation<PromptWithStats, Error, { id: string; data: PromptUpdateMutationInput }>({
		mutationFn: async ({ id, data }) => {
			const { fileBacking, model, parameters, purpose, ...inlineData } = data;
			const artifact = await getTaxonomyArtifactOrNull('prompt', id);
			if (!artifact) {
				const existingPrompt =
					parameters !== undefined || purpose !== undefined
						? await apiClient.get<PromptWithStats & { metadata?: unknown }>(`/prompts/${id}`)
						: undefined;
				return hydratePromptPortableFields(
					await apiClient.put<PromptWithStats>(
						`/prompts/${id}`,
						updateInlinePromptPayload({ ...inlineData, model, parameters, purpose }, existingPrompt?.metadata)
					)
				);
			}
			if (!fileBacking) throw new Error('The prompt is file-backed; reload the canonical editor before saving.');
			const saved = await saveTaxonomyArtifact<PromptWithStats>('prompt', id, {
				body: inlineData.content ?? artifact.body,
				expectedHash: fileBacking.expectedHash,
				metadata: {
					category: inlineData.category ?? undefined,
					color: inlineData.color ?? undefined,
					emoji: inlineData.emoji ?? undefined,
					parameters: parsePromptArtifactParameters(parameters, artifact.metadata.parameters),
					purpose: purpose ?? artifact.metadata.purpose,
					summary: inlineData.description ?? undefined,
					title: inlineData.name ?? artifact.metadata.title,
				},
				restoreMissing: fileBacking.restoreMissing,
			});
			return hydratePromptPortableFields(saved.entity);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
			void invalidateNavigationData(queryClient);
			queryClient.setQueryData(promptKeys.detail(data.id), data);
		},
	});
}

export function useDeletePrompt() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, PromptDeleteMutationInput>({
		mutationFn: async ({ contentHash, deleteMissingConfirmed = false, id, syncStatus }) => {
			if (contentHash) {
				if (syncStatus === 'missing' && !deleteMissingConfirmed) {
					throw new Error('Explicitly confirm deletion of the prompt whose canonical file is missing.');
				}
				return deleteTaxonomyArtifact('prompt', id, contentHash, syncStatus === 'missing');
			}
			return apiClient.delete(`/prompts/${id}`);
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
			void invalidateNavigationData(queryClient);
			queryClient.removeQueries({ queryKey: promptKeys.detail(id) });
			queryClient.removeQueries({ queryKey: promptKeys.images(id) });
		},
	});
}

export function useRecentPromptImages(promptId: string, limit = 6) {
	return useQuery<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>, Error>({
		queryKey: [...promptKeys.detail(promptId), 'recent-images', limit],
		queryFn: () =>
			apiClient.get<Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string }>>(
				`/prompts/${promptId}/recent-images?limit=${limit}`
			),
		enabled: !!promptId,
	});
}
