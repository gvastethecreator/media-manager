import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { mediaRoots } from '@/lib/drizzle/schema';
import type { AuthorizedRootRegistry } from '@/server/security/authorized-roots';

/**
 * Mirrors trusted runtime root identities into the path-free canonical registry.
 * Absolute paths remain owned exclusively by AuthorizedRootRegistry.
 */
export async function syncCanonicalMediaRoots(registry: AuthorizedRootRegistry): Promise<number> {
	const descriptors = registry.list();
	if (descriptors.length === 0) return 0;
	const now = new Date();
	await db
		.insert(mediaRoots)
		.values(
			descriptors.map((root) => ({
				id: root.id,
				label: root.label,
				status: 'active',
				lastSeenAt: now,
				createdAt: now,
				updatedAt: now,
			}))
		)
		.onConflictDoUpdate({
			target: mediaRoots.id,
			set: {
				label: sql`excluded.label`,
				lastSeenAt: sql`excluded.lastSeenAt`,
				status: 'active',
				updatedAt: now,
			},
		});
	return descriptors.length;
}
