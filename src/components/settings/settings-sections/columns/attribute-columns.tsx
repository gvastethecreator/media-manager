"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AttributeFormData } from "@/components/forms/entity-types";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
	string: "Texto",
	number: "Número",
	boolean: "Booleano",
	date: "Fecha",
	array: "Array",
	object: "Objeto",
	custom: "Personalizado",
};

export const columns: ColumnDef<AttributeFormData>[] = [
	{
		accessorKey: "emoji",
		header: () => <div className="w-[30px]"></div>,
		cell: ({ row }) => {
			return <div className="w-[30px]">{row.getValue("emoji")}</div>;
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nombre" />
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipo" />
		),
		cell: ({ row }) => {
			const type = row.getValue("type") as string;
			return (
				<Badge variant="outline">
					{TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}
				</Badge>
			);
		},
	},
	{
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Categoría" />
		),
	},
	{
		accessorKey: "value",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Valor" />
		),
		cell: ({ row }) => {
			const value = row.getValue("value") as string;
			return (
				<div className="max-w-[200px] truncate font-mono text-xs">{value}</div>
			);
		},
	},
	{
		accessorKey: "metadata",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Metadatos" />
		),
		cell: ({ row }) => {
			const metadata = row.getValue("metadata") as string;
			return (
				<div className="max-w-[300px] truncate font-mono text-xs">
					{metadata}
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];
