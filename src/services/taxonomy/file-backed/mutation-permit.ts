import { and, eq } from 'drizzle-orm';
import { Data } from 'effect';
import { taxonomyArtifactMutationPermits } from '@/lib/drizzle/schema/taxonomy/artifacts';
import type { FavoriteWriteTransaction } from '@/services/favorite/favorite-write-transaction';
import type { ArtifactFamily } from './file-backed.service';

export type TaxonomyArtifactMutationOperation = 'delete' | 'update';

export class TaxonomyArtifactInlineMutationError extends Data.TaggedError('TaxonomyArtifactInlineMutationError')<{
	readonly message: string;
}> {
	readonly displayMessage = this.message;
}

export function isTaxonomyArtifactInlineMutationError(error: Error): boolean {
	const messages: string[] = [];
	let current: Error | undefined = error;
	const visited = new Set<Error>();
	while (current && messages.length < 5 && !visited.has(current)) {
		visited.add(current);
		messages.push(current.message.toLowerCase());
		current = current.cause instanceof Error ? current.cause : undefined;
	}
	return messages.some((message) => message.includes('artifact_file_backed'));
}

export async function withTaxonomyArtifactMutationPermit<T>(
	transaction: FavoriteWriteTransaction,
	entityType: ArtifactFamily,
	entityId: string,
	operation: TaxonomyArtifactMutationOperation,
	mutation: () => Promise<T>
): Promise<T> {
	await transaction.insert(taxonomyArtifactMutationPermits).values({ entityId, entityType, operation });
	try {
		return await mutation();
	} finally {
		await transaction
			.delete(taxonomyArtifactMutationPermits)
			.where(
				and(
					eq(taxonomyArtifactMutationPermits.entityType, entityType),
					eq(taxonomyArtifactMutationPermits.entityId, entityId),
					eq(taxonomyArtifactMutationPermits.operation, operation)
				)
			);
	}
}
