import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileBrowserStatusBar } from './status-bar';

describe('FileBrowserStatusBar startup recovery state', () => {
	it('muestra una alerta accesible para una recuperación que requiere revisión', () => {
		render(
			<FileBrowserStatusBar
				selectedCount={0}
				shownItems={3}
				startupRecovery={{ completed: 0, manual: 1, pending: 2, state: 'manual_review_required' }}
				totalItems={3}
			/>
		);

		const alert = screen.getByTestId('file-browser-startup-recovery');
		expect(alert).toHaveTextContent('Rec. 1 revisión');
		expect(alert).toHaveAttribute('aria-live', 'polite');
		expect(alert.getAttribute('title')).toBe(
			'La recuperación de inicio requiere revisión manual para 1 operación. Además, 2 operaciones siguen pendientes de reconciliación.'
		);
		expect(alert).toHaveAttribute('aria-label', alert.getAttribute('title'));
		expect(screen.queryByText('Listo')).not.toBeInTheDocument();
	});

	it('no presenta el explorador como listo cuando no puede consultar la recuperación', () => {
		render(<FileBrowserStatusBar selectedCount={0} shownItems={3} startupRecoveryUnavailable totalItems={3} />);

		const alert = screen.getByTestId('file-browser-startup-recovery');
		expect(alert).toHaveTextContent('Rec. sin estado');
		expect(alert).toHaveAttribute('title', 'No se pudo comprobar el estado de recuperación al iniciar.');
		expect(screen.queryByText('Listo')).not.toBeInTheDocument();
	});

	it('abre la revisión sólo cuando se proporciona una acción explícita', () => {
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

		const review = screen.getByRole('button', { name: /requiere revisión manual/i });
		fireEvent.click(review);
		expect(onReviewRecovery).toHaveBeenCalledTimes(1);
	});
});
