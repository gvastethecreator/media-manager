import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileBrowserStatusBar } from './status-bar';

describe('FileBrowserStatusBar startup recovery state', () => {
	it('shows an accessible alert when startup recovery requires review', () => {
		render(
			<FileBrowserStatusBar
				selectedCount={0}
				shownItems={3}
				startupRecovery={{ completed: 0, manual: 1, pending: 2, state: 'manual_review_required' }}
				totalItems={3}
			/>
		);

		const alert = screen.getByTestId('file-browser-startup-recovery');
		expect(alert).toHaveTextContent('Recovery: 1 review');
		expect(alert).toHaveAttribute('aria-live', 'polite');
		expect(alert.getAttribute('title')).toBe(
			'Startup recovery requires manual review for 1 operation. In addition, 2 operations remain pending reconciliation.'
		);
		expect(alert).toHaveAttribute('aria-label', alert.getAttribute('title'));
		expect(screen.queryByText('Ready')).not.toBeInTheDocument();
	});

	it('does not show the browser as ready when recovery status is unavailable', () => {
		render(<FileBrowserStatusBar selectedCount={0} shownItems={3} startupRecoveryUnavailable totalItems={3} />);

		const alert = screen.getByTestId('file-browser-startup-recovery');
		expect(alert).toHaveTextContent('Recovery unavailable');
		expect(alert).toHaveAttribute('title', 'Startup recovery status could not be checked.');
		expect(screen.queryByText('Ready')).not.toBeInTheDocument();
	});

	it('opens the review only when an explicit action is provided', () => {
		const onReviewRecovery = vi.fn();
		render(
			<FileBrowserStatusBar
				onReviewRecovery={onReviewRecovery}
				selectedCount={0}
				shownItems={3}
				startupRecovery={{ completed: 0, manual: 1, pending: 0, state: 'manual_review_required' }}
				totalItems={3}
			/>
		);

		const review = screen.getByRole('button', { name: /requires manual review/i });
		fireEvent.click(review);
		expect(onReviewRecovery).toHaveBeenCalledTimes(1);
	});
});
