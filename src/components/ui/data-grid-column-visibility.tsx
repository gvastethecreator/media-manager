import { RowData, Table } from '@/lib/tanstack-react-table';
import { ReactNode } from 'react';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function DataGridColumnVisibility<TData extends RowData>({
	table,
	trigger,
}: {
	table: Table<any, TData>;
	trigger: ReactNode;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[150px]">
				<DropdownMenuLabel className="font-medium">Toggle Columns</DropdownMenuLabel>
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
								onSelect={(event) => event.preventDefault()}
							>
								{column.columnDef.meta?.headerTitle || column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { DataGridColumnVisibility };
