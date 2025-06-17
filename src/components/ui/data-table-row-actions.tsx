'use client';

import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RowAction<TData> {
	label: string;
	onClick: (data: TData) => void;
	variant?: 'default' | 'destructive';
}

interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
	actions: RowAction<TData>[];
}

export function DataTableRowActions<TData>({ row, actions }: DataTableRowActionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Abrir menú</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				{actions.map((action, _index) => (
					<DropdownMenuItem
						key={action.label}
						onClick={() => action.onClick(row.original)}
						className={action.variant === 'destructive' ? 'text-red-600' : ''}
					>
						{action.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
