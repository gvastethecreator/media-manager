import { apiClient } from './client';

export type SemanticRelationEntityType =
	| 'asset'
	| 'folder'
	| 'album'
	| 'collection'
	| 'group'
	| 'character'
	| 'place'
	| 'concept'
	| 'world_item'
	| 'prompt'
	| 'note'
	| 'wildcard';

export interface SemanticRelationEndpoint {
	id: string;
	type: SemanticRelationEntityType;
}

export interface SemanticRelationInput {
	roleSlug?: string | null;
	source: SemanticRelationEndpoint;
	target: SemanticRelationEndpoint;
}

export interface SemanticRelationView {
	createdAt: string;
	direction: 'forward' | 'inverse';
	id: string;
	label: string | null;
	other: SemanticRelationEndpoint;
	role: null | {
		forwardLabel: string;
		inverseLabel: string;
		isSymmetric: boolean;
		slug: string;
	};
	source: SemanticRelationEndpoint;
	target: SemanticRelationEndpoint;
	updatedAt: string;
}

export interface RelationRoleView {
	allowSelf: boolean;
	deprecatedAt: string | null;
	forwardLabel: string;
	inverseLabel: string;
	isSymmetric: boolean;
	replacementSlug: string | null;
	slug: string;
}

export function listRelationRoles(): Promise<{ data: RelationRoleView[] }> {
	return apiClient.get('/semantic-relations/roles');
}

export function listSemanticRelations(
	endpoint: SemanticRelationEndpoint,
	options: { limit?: number; offset?: number } = {}
): Promise<{ data: SemanticRelationView[]; limit: number; offset: number; total: number }> {
	return apiClient.get('/semantic-relations', {
		params: {
			entityId: endpoint.id,
			entityType: endpoint.type,
			limit: options.limit,
			offset: options.offset,
		},
	});
}

export function getSemanticRelation(id: string): Promise<SemanticRelationView> {
	return apiClient.get(`/semantic-relations/${encodeURIComponent(id)}`);
}

export function createSemanticRelation(input: SemanticRelationInput): Promise<SemanticRelationView> {
	return apiClient.post('/semantic-relations', input);
}

export function updateSemanticRelation(id: string, input: SemanticRelationInput): Promise<SemanticRelationView> {
	return apiClient.put(`/semantic-relations/${encodeURIComponent(id)}`, input);
}

export function deleteSemanticRelation(id: string): Promise<void> {
	return apiClient.delete(`/semantic-relations/${encodeURIComponent(id)}`);
}
