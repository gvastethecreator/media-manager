import { describe, expect, it } from 'vitest';
import {
	addFileMutationResult,
	pendingFileMutationDescription,
	type FileMutationSummary,
} from './file-mutation-result';

function createSummary(): FileMutationSummary {
	return {
		applied: 0,
		cleanupPending: 0,
		reconciliationPending: 0,
		recoveryPending: 0,
		total: 2,
	};
}

describe('file mutation results', () => {
	it('counts one operation when cleanup and the journal are both pending', () => {
		const summary = createSummary();
		addFileMutationResult(summary, { cleanupPending: true, recoveryPending: true });

		expect(summary).toMatchObject({
			applied: 1,
			cleanupPending: 1,
			reconciliationPending: 1,
			recoveryPending: 1,
		});
		expect(pendingFileMutationDescription(summary)).toBe(
			'1 operation remains pending reconciliation. 1 source copy is still waiting to be removed. The recovery record for 1 operation needs a check on restart.'
		);
	});

	it('keeps distinct operations that need reconciliation', () => {
		const summary = createSummary();
		addFileMutationResult(summary, { cleanupPending: true, recoveryPending: false });
		addFileMutationResult(summary, { cleanupPending: false, recoveryPending: true });

		expect(summary.reconciliationPending).toBe(2);
		expect(pendingFileMutationDescription(summary)).toContain('2 operations remain pending reconciliation.');
	});
});
