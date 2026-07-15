import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export type AuthorizedRootPermission = 'delete' | 'export' | 'index' | 'read' | 'write';
export type MediaAssetType = 'audio' | 'document' | 'file3d' | 'image' | 'json' | 'video';

export interface AuthorizedPathReference {
	relativePath: string;
	rootId: string;
}

export interface AuthorizedRootDescriptor {
	allowCrossRoot: boolean;
	id: string;
	label: string;
	permissions: AuthorizedRootPermission[];
}

export interface MediaAssetReference {
	assetId: string;
	assetType: MediaAssetType;
}

export function toMediaAssetType(value: unknown): MediaAssetType | null {
	if (value === 'jsonFile') return 'json';
	return ['audio', 'document', 'file3d', 'image', 'json', 'video'].includes(String(value))
		? (value as MediaAssetType)
		: null;
}

interface AuthorizedRootsResponse {
	roots: AuthorizedRootDescriptor[];
}

export const authorizedRootKeys = {
	all: ['authorized-roots'] as const,
};

export async function getAuthorizedRoots(): Promise<AuthorizedRootDescriptor[]> {
	const response = await apiClient.get<AuthorizedRootsResponse>('/files/roots');
	return Array.isArray(response.roots) ? response.roots : [];
}

export function useAuthorizedRoots() {
	return useQuery<AuthorizedRootDescriptor[], Error>({
		queryKey: authorizedRootKeys.all,
		queryFn: getAuthorizedRoots,
		staleTime: 5 * 60 * 1000,
	});
}
