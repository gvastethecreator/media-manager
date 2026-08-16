/**
 * TanStack Table v9 compatibility surface.
 *
 * The v9 package keeps the v8-style React API under `/legacy`. Keeping the
 * adapter in one place lets the UI migrate to the current package without
 * leaking v8/v9 generic differences through every table component.
 */
import type {
	Cell as CoreCell,
	Column as CoreColumn,
	ColumnDef as CoreColumnDef,
	ColumnMeta as CoreColumnMeta,
	ColumnVisibilityState,
	Header as CoreHeader,
	HeaderGroup as CoreHeaderGroup,
	Row as CoreRow,
	RowData,
	Table as CoreTable,
	TableFeatures,
} from '@tanstack/table-core';
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useLegacyTable,
} from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';
import type {
	LegacyCell,
	LegacyColumn,
	LegacyColumnDef,
	LegacyFeatures,
	LegacyHeader,
	LegacyHeaderGroup,
	LegacyReactTable,
	LegacyRow,
} from '@tanstack/react-table/legacy';

export { flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel };
export const useReactTable = useLegacyTable;

export type { ColumnFiltersState, RowData, SortingState, TableFeatures } from '@tanstack/table-core';
export type VisibilityState = ColumnVisibilityState;

// Keep the feature-first generic shape accepted by the v9 core types while
// binding every component to the legacy feature set at runtime.
export type Table<_TFeatures extends TableFeatures = LegacyFeatures, TData extends RowData = RowData> = LegacyReactTable<TData>;
export type Column<_TFeatures extends TableFeatures, TData extends RowData, TValue = unknown> = LegacyColumn<TData, TValue>;
export type ColumnDef<_TFeatures extends TableFeatures, TData extends RowData, TValue = unknown> = LegacyColumnDef<TData, TValue>;
export type Row<_TFeatures extends TableFeatures, TData extends RowData> = LegacyRow<TData>;
export type Cell<_TFeatures extends TableFeatures, TData extends RowData, TValue = unknown> = LegacyCell<TData, TValue>;
export type Header<_TFeatures extends TableFeatures, TData extends RowData, TValue = unknown> = LegacyHeader<TData, TValue>;
export type HeaderGroup<_TFeatures extends TableFeatures, TData extends RowData> = LegacyHeaderGroup<TData>;

// These imports are intentionally kept as type-only aliases for consumers
// that need to describe the underlying core objects in narrow helpers.
export type { CoreCell, CoreColumn, CoreColumnDef, CoreColumnMeta, CoreHeader, CoreHeaderGroup, CoreRow, CoreTable };

declare module '@tanstack/table-core' {
	interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue> {
		readonly __valueType__?: TValue | undefined;
		cellClassName?: string;
		expandedContent?: (row: TData) => import('react').ReactNode;
		headerClassName?: string;
		headerTitle?: string;
		skeleton?: import('react').ReactNode;
	}
}
