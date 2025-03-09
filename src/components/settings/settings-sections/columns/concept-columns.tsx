'use client';

import type { ConceptFormData } from '@/components/features/entity-cards/forms/entity-types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import type { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<ConceptFormData>[] = [
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
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];
