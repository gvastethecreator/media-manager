import { ApiClientError, apiClient } from './client';

export type TaxonomyArtifactType = 'note' | 'prompt' | 'wildcard';
export type TaxonomyArtifactParameterType = 'text' | 'number' | 'boolean' | 'date' | 'enum_token';
export type TaxonomyArtifactParameterValue = boolean | number | string | boolean[] | number[] | string[];

export interface TaxonomyArtifactParameter {
	canonicalKey?: 'subject' | 'context' | 'tone' | 'style' | 'constraints';
	custom: boolean;
	default?: TaxonomyArtifactParameterValue;
	description?: string;
	enumTokens?: string[];
	example?: TaxonomyArtifactParameterValue;
	key: string;
	multiple?: boolean;
	required?: boolean;
	type: TaxonomyArtifactParameterType;
}

export interface TaxonomyArtifactMetadata {
	category?: string;
	color?: string;
	emoji?: string;
	id?: string;
	kind?: TaxonomyArtifactType;
	parameters?: TaxonomyArtifactParameter[];
	purpose?: string;
	schemaVersion?: 1;
	summary?: string;
	title: string;
}

export interface TaxonomyArtifactDocument {
	body: string;
	byteSize: number;
	contentHash: string;
	entityId: string;
	entityType: TaxonomyArtifactType;
	metadata: TaxonomyArtifactMetadata;
	relativePath: string;
	rootId: string;
	syncStatus: 'conflict' | 'error' | 'external_change' | 'missing' | 'synced';
}

/** Indexed search projection. Unlike an authored document, this shape does not imply a filesystem read. */
export interface TaxonomyArtifactSearchHit {
	byteSize: number;
	contentHash: string;
	createdAt: string;
	entityId: string;
	entityType: TaxonomyArtifactType;
	indexedBody: string;
	indexedSummary: string | null;
	indexedTitle: string;
	lastSyncedAt: string;
	relativePath: string;
	rootId: string;
	syncStatus: TaxonomyArtifactDocument['syncStatus'];
	updatedAt: string;
}

export interface SaveTaxonomyArtifactInput {
	body: string;
	expectedHash?: string;
	metadata: Omit<TaxonomyArtifactMetadata, 'id' | 'kind' | 'schemaVersion'>;
	operational?: {
		featuredImage?: string | null;
		parentId?: string | null;
		shortcut?: string | null;
	};
	rootId?: string;
	restoreMissing?: boolean;
}

export interface CreateFileBackedWildcardResult<TEntity = unknown> {
	artifact: TaxonomyArtifactDocument;
	entity: TEntity;
}

/** The canonical PUT keeps the artifact document at top level and adds the committed entity projection. */
export interface SaveTaxonomyArtifactResult<TEntity = unknown> extends TaxonomyArtifactDocument {
	entity: TEntity;
}

function artifactEndpoint(entityType: TaxonomyArtifactType, entityId: string): string {
	return `/taxonomy-artifacts/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`;
}

export function getTaxonomyArtifact(
	entityType: TaxonomyArtifactType,
	entityId: string
): Promise<TaxonomyArtifactDocument> {
	return apiClient.get<TaxonomyArtifactDocument>(artifactEndpoint(entityType, entityId));
}

export async function getTaxonomyArtifactOrNull(
	entityType: TaxonomyArtifactType,
	entityId: string
): Promise<TaxonomyArtifactDocument | null> {
	try {
		return await getTaxonomyArtifact(entityType, entityId);
	} catch (error) {
		if (error instanceof ApiClientError && error.status === 404) return null;
		throw error;
	}
}

export function saveTaxonomyArtifact<TEntity = unknown>(
	entityType: TaxonomyArtifactType,
	entityId: string,
	input: SaveTaxonomyArtifactInput
): Promise<SaveTaxonomyArtifactResult<TEntity>> {
	return apiClient.put<SaveTaxonomyArtifactResult<TEntity>>(artifactEndpoint(entityType, entityId), input);
}

export function createFileBackedWildcard<TEntity = unknown>(
	input: Pick<SaveTaxonomyArtifactInput, 'body' | 'metadata' | 'operational'> & { rootId: string }
): Promise<CreateFileBackedWildcardResult<TEntity>> {
	const { body, metadata, operational, rootId } = input;
	return apiClient.post<CreateFileBackedWildcardResult<TEntity>>('/taxonomy-artifacts/wildcard', {
		body,
		metadata,
		operational,
		rootId,
	});
}

export function relocateTaxonomyArtifact(
	entityType: TaxonomyArtifactType,
	entityId: string,
	input: { expectedHash: string; fileName: string }
): Promise<TaxonomyArtifactDocument> {
	return apiClient.patch<TaxonomyArtifactDocument>(`${artifactEndpoint(entityType, entityId)}/location`, input);
}

export function deleteTaxonomyArtifact(
	entityType: TaxonomyArtifactType,
	entityId: string,
	expectedHash: string,
	deleteMissing = false
): Promise<void> {
	return apiClient.delete<void>(artifactEndpoint(entityType, entityId), { deleteMissing, expectedHash });
}

export function rebuildTaxonomyArtifactIndex(entityType?: TaxonomyArtifactType): Promise<{
	adopted: number;
	conflict: number;
	error: number;
	finalizedDeletes: number;
	finalizedWrites: number;
	missing: number;
	quarantinedTemps: number;
	recoveredDeletes: number;
	relocated: number;
	suppressedReappearances: number;
	synced: number;
	tombstones: number;
	total: number;
}> {
	return apiClient.post('/taxonomy-artifacts/rebuild', entityType ? { entityType } : {});
}

export function searchTaxonomyArtifacts(input: {
	entityType?: TaxonomyArtifactType;
	limit?: number;
	offset?: number;
	query: string;
}): Promise<{ data: TaxonomyArtifactSearchHit[]; limit: number; offset: number }> {
	return apiClient.get('/taxonomy-artifacts/search', {
		params: { entityType: input.entityType, limit: input.limit, offset: input.offset, q: input.query },
	});
}
