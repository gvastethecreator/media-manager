export interface FileMutationItemResult {
	cleanupPending: boolean;
	recoveryPending: boolean;
}

export interface FileMutationSummary {
	applied: number;
	cleanupPending: number;
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
}

export function pendingFileMutationDescription(summary: FileMutationSummary): string | null {
	const pending = summary.cleanupPending + summary.recoveryPending;
	if (pending === 0) return null;
	return `${pending} operación${pending === 1 ? '' : 'es'} quedó${pending === 1 ? '' : 'aron'} pendiente${pending === 1 ? '' : 's'} de reconciliación automática.`;
}
