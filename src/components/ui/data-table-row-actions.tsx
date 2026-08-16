import type { Row, RowData } from '@/lib/tanstack-react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RowAction<TData extends RowData> {
	label: string;
	onClick: (data: TData) => void;
	variant?: 'default' | 'destructive';
}

interface DataTableRowActionsProps<TData extends RowData> {
	actions: RowAction<TData>[];
	row: Row<any, TData>;
}

export function DataTableRowActions<TData extends RowData>({ row, actions }: DataTableRowActionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" variant="ghost">
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				{actions.map((action, _index) => (
					<DropdownMenuItem
						className={action.variant === 'destructive' ? 'text-destructive' : ''}
						key={action.label}
						onClick={() => action.onClick(row.original)}
					>
						{action.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
