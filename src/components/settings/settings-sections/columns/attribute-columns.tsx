'use client';

import type { AttributeFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

interface RowAction {
	label: string;
	onClick: (data: AttributeFormData) => void;
	variant?: 'default' | 'destructive';
}

export const columns: ColumnDef<AttributeFormData>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
		cell: ({ row }) => {
			const name = row.getValue('name') as string;
			const emoji = row.original.emoji as string;
			const color = row.original.color as string;

			return (
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
						<span className="text-white text-lg">{emoji}</span>
					</div>
					<span className="font-medium">{name}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'type',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
		cell: ({ row }) => {
			const type = row.getValue('type') as string;
			return (
				<Badge
					variant="secondary"
					className={cn(
						'capitalize',
						type === 'text' && 'bg-blue-100 text-blue-800',
						type === 'number' && 'bg-green-100 text-green-800',
						type === 'boolean' && 'bg-yellow-100 text-yellow-800',
						type === 'date' && 'bg-purple-100 text-purple-800',
						type === 'color' && 'bg-pink-100 text-pink-800',
						type === 'range' && 'bg-indigo-100 text-indigo-800',
						type === 'select' && 'bg-orange-100 text-orange-800',
						type === 'multiselect' && 'bg-red-100 text-red-800'
					)}
				>
					{type}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: 'category',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Categoría" />,
		cell: ({ row }) => {
			const category = row.getValue('category') as string;
			return (
				<Badge
					variant="secondary"
					className={cn(
						'capitalize',
						category === 'general' && 'bg-gray-100 text-gray-800',
						category === 'character' && 'bg-blue-100 text-blue-800',
						category === 'place' && 'bg-green-100 text-green-800',
						category === 'object' && 'bg-yellow-100 text-yellow-800',
						category === 'concept' && 'bg-purple-100 text-purple-800',
						category === 'prompt' && 'bg-pink-100 text-pink-800',
						category === 'note' && 'bg-indigo-100 text-indigo-800',
						category === 'system' && 'bg-red-100 text-red-800'
					)}
				>
					{category}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: 'value',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
		cell: ({ row }) => {
			const value = row.getValue('value') as string;
			return <span className="font-mono text-sm">{value}</span>;
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const actions: RowAction[] = [
				{
					label: 'Editar',
					onClick: (_data) => {},
				},
				{
					label: 'Eliminar',
					onClick: (_data) => {},
					variant: 'destructive',
				},
			];

			return <DataTableRowActions row={row} actions={actions} />;
		},
	},
];
