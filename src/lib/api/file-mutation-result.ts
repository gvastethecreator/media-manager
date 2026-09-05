export interface FileMutationItemResult {
	cleanupPending: boolean;
	recoveryPending: boolean;
}

export interface FileMutationSummary {
	applied: number;
	cleanupPending: number;
	reconciliationPending: number;
	recoveryPending: number;
	total: number;
}

export class PartialFileMutationError extends Error {
	readonly summary: FileMutationSummary;

	constructor(message: string, summary: FileMutationSummary, cause?: unknown) {
		super(message, { cause });
		this.name = 'PartialFileMutationError';
		this.summary = summary;
	}
}

export function addFileMutationResult(summary: FileMutationSummary, item: FileMutationItemResult): void {
	summary.applied += 1;
	if (item.cleanupPending) summary.cleanupPending += 1;
	if (item.recoveryPending) summary.recoveryPending += 1;
	if (item.cleanupPending || item.recoveryPending) summary.reconciliationPending += 1;
}

export function pendingFileMutationDescription(summary: FileMutationSummary): string | null {
	if (summary.reconciliationPending === 0) return null;
	const details: string[] = [];
	if (summary.cleanupPending > 0) {
		details.push(
			summary.cleanupPending === 1
				? '1 source copy is still waiting to be removed.'
				: `${summary.cleanupPending} source copies are still waiting to be removed.`
		);
	}
	if (summary.recoveryPending > 0) {
		details.push(
			`The recovery record for ${summary.recoveryPending} ${summary.recoveryPending === 1 ? 'operation' : 'operations'} needs a check on restart.`
		);
	}
	return `${summary.reconciliationPending} ${summary.reconciliationPending === 1 ? 'operation remains' : 'operations remain'} pending reconciliation. ${details.join(' ')}`;
}
