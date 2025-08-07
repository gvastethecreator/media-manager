/**
 * Test básico para EmptySpaceContextMenu
 * Este archivo verifica que el componente se renderice correctamente
 */

import { describe, expect, it, mock } from 'bun:test';
import { render, screen } from '@/test/test-utils';
import { EmptySpaceContextMenu } from './empty-space-context-menu';

// Mock de las dependencias
mock.module('@/lib/keyboard', () => ({
	useContextMenuNavigation: () => ({
		selectedIndex: -1,
		getItemProps: () => ({}),
	}),
}));

mock.module('./context-action-handler', () => ({
	clipboardManager: {
		canPaste: () => false,
	},
}));

describe('EmptySpaceContextMenu', () => {
	const defaultProps = {
		onAction: mock(),
		position: { x: 100, y: 100 },
		totalItems: 5,
	};

	it('should render all menu options', () => {
		render(<EmptySpaceContextMenu {...defaultProps} />);

		expect(screen.getByText('Seleccionar todo (5)')).toBeInTheDocument();
		expect(screen.getByText('Pegar')).toBeInTheDocument();
		expect(screen.getByText('Actualizar')).toBeInTheDocument();
		expect(screen.getByText('Nueva carpeta')).toBeInTheDocument();
	});

	it('should disable select all when no items', () => {
		render(<EmptySpaceContextMenu {...defaultProps} totalItems={0} />);

		const selectAllButton = screen.getByText('Seleccionar todo (0)');
		expect(selectAllButton).toBeDisabled();
	});

	it('should show current path when provided', () => {
		render(<EmptySpaceContextMenu {...defaultProps} currentPath="/test/path" />);

		expect(screen.getByText('/test/path')).toBeInTheDocument();
	});

	it('should call onAction when menu item is clicked', () => {
		const onAction = mock();
		render(<EmptySpaceContextMenu {...defaultProps} onAction={onAction} />);

		const refreshButton = screen.getByText('Actualizar');
		refreshButton.click();

		expect(onAction).toHaveBeenCalledWith('refresh', undefined);
	});
});
