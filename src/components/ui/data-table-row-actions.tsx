"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
	onUpdate?: (data: TData) => Promise<void>;
	onDelete?: (data: TData) => Promise<void>;
}

export function DataTableRowActions<TData>({
	row,
	onUpdate,
	onDelete,
}: DataTableRowActionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
				>
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Abrir menú</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				{onUpdate && (
					<DropdownMenuItem
						onClick={() => onUpdate(row.original)}
						className="cursor-pointer"
					>
						<Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Editar
					</DropdownMenuItem>
				)}
				{onDelete && (
					<DropdownMenuItem
						onClick={() => onDelete(row.original)}
						className="cursor-pointer text-destructive focus:text-destructive"
					>
						<Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Eliminar
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
