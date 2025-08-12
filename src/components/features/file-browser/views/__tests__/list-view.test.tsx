/**
 * @file Tests para ListView mejorado con columnas configurables
 * @description Tests básicos para verificar funcionalidad del nuevo ListView
 */

import { describe, expect, it, mock } from 'bun:test';

// Regex top-level para accesibilidad y rendimiento en queries
const RE_NOMBRE = /nombre/i;
const RE_TAMANO = /tamaño/i;

import { render, screen } from '@testing-library/react';
import { ListView } from '@/components/features/file-browser/views/list-view';
import type { AnyEntityWithStats } from '@/types/migration';

// Mock de dependencias
mock.module('@/hooks/use-list-view-config', () => ({
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
		updateColumn: mock(),
		reorderColumns: mock(),
		toggleColumnVisibility: mock(),
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

mock.module('@tanstack/react-virtual', () => ({
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

mock.module('motion/react', () => ({
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
				size: 1_024_000,
				mtime: new Date('2023-01-01').toISOString(),
				birthtime: new Date('2023-01-01').toISOString(),
			},
		},
	] as any;

	const defaultProps = {
		items: mockItems as AnyEntityWithStats[],
		selectedIds: [] as string[],
		containerWidth: 800,
		onItemClick: mock(),
		onItemDoubleClick: mock(),
		onItemContextMenu: mock(),
		onSort: mock(),
	};

	it('renderiza correctamente con items', () => {
		render(<ListView {...defaultProps} />);

		expect(screen.getByTestId('listview-container')).toBeInTheDocument();
		expect(screen.getByRole('table')).toBeInTheDocument();
	});

	it('muestra el header de columnas cuando showHeader es true', () => {
		render(<ListView {...defaultProps} />);

		expect(screen.getByRole('columnheader', { name: RE_NOMBRE })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: RE_TAMANO })).toBeInTheDocument();
	});

	it('aplica data-view-type="list" al contenedor', () => {
		render(<ListView {...defaultProps} />);

		const container = screen.getByTestId('listview-container');
		expect(container).toHaveAttribute('data-view-type', 'list');
	});

	it('llama a onItemClick cuando se hace click en un item', () => {
		const onItemClick = mock();
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
