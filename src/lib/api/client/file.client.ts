/**
 * Cliente de API para operaciones de archivos.
 */
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import { apiClient } from '@/lib/api/client';

export interface AuthorizedDirectoryItem {
	createdAt: Date | string;
	extension: string;
	id: string;
	isDirectory?: boolean;
	isHidden?: boolean;
	mimeType: string;
	modifiedAt?: Date | string;
	name: string;
	relativePath: string;
	rootId: string;
	size: number;
	type: string;
	updatedAt: Date | string;
}

export interface AuthorizedDirectoryReadResult extends AuthorizedPathReference {
	items: AuthorizedDirectoryItem[];
	total: number;
}

export async function getDirectoryInfoFromApi(
	reference: AuthorizedPathReference
): Promise<AuthorizedDirectoryReadResult> {
	const response = await apiClient.get<{ data: AuthorizedDirectoryReadResult }>('/files/directory', {
		params: { path: reference.relativePath, rootId: reference.rootId },
	});
	return response.data;
}
