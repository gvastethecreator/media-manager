import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type RowData,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from '@/lib/tanstack-react-table';
import React from 'react';

import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData extends RowData, TValue> {
	columns: ColumnDef<any, TData, TValue>[];
	data: TData[];
	onDelete?: (data: TData) => Promise<void>;
	onUpdate?: (data: TData) => Promise<void>;
}

export function DataTable<TData extends RowData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns: columns as any,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div aria-busy={false} className="space-y-4">
			<DataTableToolbar table={table} />
			<div className="rounded-dt-md border-2 border-border/50 shadow-dt-1">
				<Table role="grid">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow className="border-border/40" key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead className="text-muted-foreground" key={header.id}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									className="transition-colors duration-dt-fast ease-dt-out hover:bg-muted/40"
									data-state={row.getIsSelected() && 'selected'}
									key={row.id}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center text-muted-foreground" colSpan={columns.length}>
									No hay resultados.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
