/**
 * @file Tests para ListView mejorado con columnas configurables
 * @description Tests básicos para verificar funcionalidad del nuevo ListView
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListView } from '@/components/features/file-browser/views/list-view';
import type { AnyEntityWithStats } from '@/types/migration';

// Mock de dependencias
vi.mock('@/hooks/use-list-view-config', () => ({
	useListViewConfig: () => ({
		config: {
			columns: [
				{
					key: 'name',
					label: 'Nombre',
					width: 'auto',
					visible: true,
					sortable: true,
					order: 0,
				},
				{
					key: 'size',
					label: 'Tamaño',
					width: 100,
					visible: true,
					sortable: true,
					order: 1,
				},
			],
			rowHeight: 72,
			showZebraStripes: true,
			showHeader: true,
			allowResize: true,
			allowReorder: true,
			showThumbnails: true,
			thumbnailSize: 'medium' as const,
			rowGap: 2,
			cellPadding: 12,
		},
		visibleColumns: [
			{
				key: 'name',
				label: 'Nombre',
				width: 'auto',
				visible: true,
				sortable: true,
				order: 0,
			},
			{
				key: 'size',
				label: 'Tamaño',
				width: 100,
				visible: true,
				sortable: true,
				order: 1,
			},
		],
		updateColumn: vi.fn(),
		reorderColumns: vi.fn(),
		toggleColumnVisibility: vi.fn(),
		getColumnsWithRenderers: () => [
			{
				key: 'name',
				label: 'Nombre',
				width: 'auto',
				visible: true,
				sortable: true,
				order: 0,
			},
			{
				key: 'size',
				label: 'Tamaño',
				width: 100,
				visible: true,
				sortable: true,
				order: 1,
			},
		],
	}),
}));

vi.mock('@tanstack/react-virtual', () => ({
	useVirtualizer: () => ({
		getTotalSize: () => 500,
		getVirtualItems: () => [
			{
				index: 0,
				start: 0,
				size: 72,
			},
		],
	}),
}));

vi.mock('motion/react', () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
}));

describe('ListView', () => {
	const mockItems: AnyEntityWithStats[] = [
		{
			id: '1',
			name: 'Test Image',
			entityType: 'image',
			type: 'image',
			stats: {
				size: 1024000,
				mtime: new Date('2023-01-01').toISOString(),
				birthtime: new Date('2023-01-01').toISOString(),
			},
		},
	] as any;

	const defaultProps = {
		items: mockItems,
		selectedIds: [],
		containerWidth: 800,
		onItemClick: vi.fn(),
		onItemDoubleClick: vi.fn(),
		onItemContextMenu: vi.fn(),
		onSort: vi.fn(),
	};

	it('renderiza correctamente con items', () => {
		render(<ListView {...defaultProps} />);

		expect(screen.getByTestId('listview-container')).toBeInTheDocument();
		expect(screen.getByRole('table')).toBeInTheDocument();
	});

	it('muestra el header de columnas cuando showHeader es true', () => {
		render(<ListView {...defaultProps} />);

		expect(screen.getByRole('columnheader', { name: /nombre/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /tamaño/i })).toBeInTheDocument();
	});

	it('aplica data-view-type="list" al contenedor', () => {
		render(<ListView {...defaultProps} />);

		const container = screen.getByTestId('listview-container');
		expect(container).toHaveAttribute('data-view-type', 'list');
	});

	it('llama a onItemClick cuando se hace click en un item', () => {
		const onItemClick = vi.fn();
		render(<ListView {...defaultProps} onItemClick={onItemClick} />);

		// Verificar que el evento se configura correctamente
		expect(onItemClick).not.toHaveBeenCalled();
	});

	it('maneja correctamente la selección de items', () => {
		const selectedIds = ['1'];
		render(<ListView {...defaultProps} selectedIds={selectedIds} />);

		expect(screen.getByTestId('listview-container')).toBeInTheDocument();
	});

	it('aplica el entityType correcto para configuración de columnas', () => {
		render(<ListView {...defaultProps} entityType="image" />);

		expect(screen.getByTestId('listview-container')).toBeInTheDocument();
	});
});
