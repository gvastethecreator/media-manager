import type { RowData, Table } from '@/lib/tanstack-react-table';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableViewOptionsProps<TData extends RowData> {
	table: Table<any, TData>;
}

export function DataTableViewOptions<TData extends RowData>({ table }: DataTableViewOptionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="ml-auto h-8" size="sm" variant="outline">
					<Settings2 className="mr-2 h-4 w-4" />
					Ver
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[150px]">
				<DropdownMenuLabel>Columnas</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
					.map((column) => {
						return (
							<DropdownMenuCheckboxItem
								checked={column.getIsVisible()}
								className="capitalize"
								key={column.id}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
