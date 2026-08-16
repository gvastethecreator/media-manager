import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { taxonomyArtifacts } from '@/lib/drizzle/schema/taxonomy/artifacts';
import type { ArtifactFamily } from '@/services/taxonomy/file-backed/file-backed.service';
import { type AuthorizedRootRegistry, type RootPermission, RootAuthorizationError } from './authorized-roots';

const TAXONOMY_ROOT_PERMISSIONS = ['read', 'index', 'write', 'delete'] as const satisfies readonly RootPermission[];

export type TaxonomyRootPermission = (typeof TAXONOMY_ROOT_PERMISSIONS)[number];

export function assertTaxonomyRootPermissions(
	registry: AuthorizedRootRegistry,
	rootId: string,
	permissions: readonly TaxonomyRootPermission[]
): void {
	const root = registry.list().find((candidate) => candidate.id === rootId);
	if (!root) {
		throw new RootAuthorizationError('ROOT_NOT_FOUND', 'Entidad taxonomy no encontrada.', 404);
	}
	for (const permission of permissions) {
		if (!root.permissions.includes(permission)) {
			throw new RootAuthorizationError('ROOT_PERMISSION_DENIED', 'El media root no concede esta operación.', 403);
		}
	}
}

/**
 * Authorizes the media root that owns a file-backed taxonomy entity.
 *
 * Inline legacy entities intentionally have no root binding and remain available.
 * A withdrawn root is reported as not found, while an active root that lacks a
 * requested capability is reported as forbidden.
 */
export async function assertTaxonomyEntityRootPermissions(
	registry: AuthorizedRootRegistry,
	entityType: ArtifactFamily,
	entityId: string,
	permissions: readonly TaxonomyRootPermission[]
): Promise<void> {
	const [binding] = await db
		.select({ rootId: taxonomyArtifacts.rootId })
		.from(taxonomyArtifacts)
		.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)))
		.limit(1);
	if (!binding) return;

	assertTaxonomyRootPermissions(registry, binding.rootId, permissions);
}
