import { afterEach, describe, expect, it, vi } from 'vitest';
import { progressTrackingService } from './progress-tracking.service';

afterEach(() => {
	progressTrackingService.clearCompleted();
});

describe('progress tracking operation IDs', () => {
	it('returns the stored operation ID and runs the registered cancellation callback once', () => {
		const onCancel = vi.fn();
		const operationId = progressTrackingService.startOperation('file_download', 1, {
			onCancel,
			showToast: false,
		});

		expect(progressTrackingService.getOperation(operationId)).toMatchObject({ id: operationId, status: 'pending' });

		progressTrackingService.cancelOperation(operationId);
		progressTrackingService.cancelOperation(operationId);

		expect(onCancel).toHaveBeenCalledOnce();
		expect(progressTrackingService.getOperation(operationId)).toMatchObject({ status: 'cancelled' });
	});
});
