'use client';

import { ColumnFiltersState, RowData, SortingState, Table, TableFeatures } from '@/lib/tanstack-react-table';
import { createContext, ReactNode, useContext } from 'react';
import { cn } from '@/lib/utils';

export interface DataGridApiFetchParams {
	filters?: ColumnFiltersState;
	pageIndex: number;
	pageSize: number;
	searchQuery?: string;
	sorting?: SortingState;
}

export interface DataGridApiResponse<T> {
	data: T[];
	empty: boolean;
	pagination: {
		total: number;
		page: number;
	};
}

export interface DataGridContextProps<TData extends RowData> {
	isLoading: boolean;
	props: DataGridProps<TData>;
	recordCount: number;
	table: Table<any, TData>;
}

export interface DataGridRequestParams {
	columnFilters?: ColumnFiltersState;
	pageIndex: number;
	pageSize: number;
	sorting?: SortingState;
}

export interface DataGridProps<TData extends RowData> {
	children?: ReactNode;
	className?: string;
	emptyMessage?: ReactNode | string;
	isLoading?: boolean;
	loadingMessage?: ReactNode | string;
	loadingMode?: 'skeleton' | 'spinner';
	onRowClick?: (row: TData) => void;
	recordCount: number;
	table?: Table<any, TData>;
	tableClassNames?: {
		base?: string;
		header?: string;
		headerRow?: string;
		headerSticky?: string;
		body?: string;
		bodyRow?: string;
		footer?: string;
		edgeCell?: string;
	};
	tableLayout?: {
		dense?: boolean;
		cellBorder?: boolean;
		rowBorder?: boolean;
		rowRounded?: boolean;
		stripped?: boolean;
		headerBackground?: boolean;
		headerBorder?: boolean;
		headerSticky?: boolean;
		width?: 'auto' | 'fixed';
		columnsVisibility?: boolean;
		columnsResizable?: boolean;
		columnsPinnable?: boolean;
		columnsMovable?: boolean;
		columnsDraggable?: boolean;
		rowsDraggable?: boolean;
	};
}

const DataGridContext = createContext<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	DataGridContextProps<any> | undefined
>(undefined);

function useDataGrid() {
	const context = useContext(DataGridContext);
	if (!context) {
		throw new Error('useDataGrid must be used within a DataGridProvider');
	}
	return context;
}

function DataGridProvider<TData extends RowData>({
	children,
	table,
	...props
}: DataGridProps<TData> & { table: Table<any, TData> }) {
	return (
		<DataGridContext.Provider
			value={{
				props,
				table: table as Table<any, any>,
				recordCount: props.recordCount,
				isLoading: !!props.isLoading,
			}}
		>
			{children}
		</DataGridContext.Provider>
	);
}

function DataGrid<TData extends RowData>({ children, table, ...props }: DataGridProps<TData>) {
	const defaultProps: Partial<DataGridProps<TData>> = {
		loadingMode: 'skeleton',
		tableLayout: {
			dense: false,
			cellBorder: false,
			rowBorder: true,
			rowRounded: false,
			stripped: false,
			headerSticky: false,
			headerBackground: true,
			headerBorder: true,
			width: 'fixed',
			columnsVisibility: false,
			columnsResizable: false,
			columnsPinnable: false,
			columnsMovable: false,
			columnsDraggable: false,
			rowsDraggable: false,
		},
		tableClassNames: {
			base: '',
			header: '',
			headerRow: '',
			headerSticky: 'sticky top-0 z-10 bg-background/90 backdrop-blur-xs',
			body: '',
			bodyRow: '',
			footer: '',
			edgeCell: '',
		},
	};

	const mergedProps: DataGridProps<TData> = {
		...defaultProps,
		...props,
		tableLayout: {
			...defaultProps.tableLayout,
			...(props.tableLayout || {}),
		},
		tableClassNames: {
			...defaultProps.tableClassNames,
			...(props.tableClassNames || {}),
		},
	};

	// Ensure table is provided
	if (!table) {
		throw new Error('DataGrid requires a "table" prop');
	}

	return (
		<DataGridProvider table={table} {...mergedProps}>
			{children}
		</DataGridProvider>
	);
}

function DataGridContainer({
	children,
	className,
	border = true,
}: {
	children: ReactNode;
	className?: string;
	border: boolean;
}) {
	return (
		<div className={cn('grid w-full', border && 'rounded-dt-lg border-2 border-border/50 shadow-dt-1', className)} data-slot="data-grid">
			{children}
		</div>
	);
}

export { DataGrid, DataGridContainer, DataGridProvider, useDataGrid };
