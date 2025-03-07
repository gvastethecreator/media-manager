'use client';

import type { PromptFormData } from '@/components/forms/entity-types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import type { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<PromptFormData>[] = [
	{
		accessorKey: 'emoji',
		header: () => <div className="w-[30px]" />,
		cell: ({ row }) => {
			return <div className="w-[30px]">{row.getValue('emoji')}</div>;
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
	},
	{
		accessorKey: 'category',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Categoría" />,
	},
	{
		accessorKey: 'content',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Contenido" />,
		cell: ({ row }) => {
			const content = row.getValue('content') as string;
			return <div className="max-w-[500px] truncate">{content}</div>;
		},
	},
	{
		accessorKey: 'parameters',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Parámetros" />,
		cell: ({ row }) => {
			const parameters = row.getValue('parameters') as string;
			return <div className="max-w-[300px] truncate font-mono text-xs">{parameters}</div>;
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];
