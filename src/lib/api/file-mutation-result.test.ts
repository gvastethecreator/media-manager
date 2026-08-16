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
	it('cuenta una sola operación cuando la limpieza y el journal están pendientes', () => {
		const summary = createSummary();
		addFileMutationResult(summary, { cleanupPending: true, recoveryPending: true });

		expect(summary).toMatchObject({
			applied: 1,
			cleanupPending: 1,
			reconciliationPending: 1,
			recoveryPending: 1,
		});
		expect(pendingFileMutationDescription(summary)).toBe(
			'1 operación queda pendiente de reconciliación. 1 copia de origen sigue pendiente de retirar. El registro de recuperación de 1 operación requiere verificación al reiniciar.'
		);
	});

	it('distingue las operaciones distintas que necesitan reconciliación', () => {
		const summary = createSummary();
		addFileMutationResult(summary, { cleanupPending: true, recoveryPending: false });
		addFileMutationResult(summary, { cleanupPending: false, recoveryPending: true });

		expect(summary.reconciliationPending).toBe(2);
		expect(pendingFileMutationDescription(summary)).toContain('2 operaciones quedan pendientes de reconciliación.');
	});
});
