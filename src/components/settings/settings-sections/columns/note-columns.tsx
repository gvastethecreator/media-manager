"use client";

import type { NoteFormData } from "@/components/features/entity-cards/forms/entity-types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import type { ColumnDef } from "@tanstack/react-table";

type BadgeVariant = "default" | "secondary" | "outline";

const PRIORITY_LABELS = ["Baja", "Media", "Alta", "Urgente"];
const PRIORITY_VARIANTS: BadgeVariant[] = [
	"default",
	"secondary",
	"secondary",
	"secondary",
];

const STATUS_LABELS: Record<string, string> = {
	active: "Activa",
	archived: "Archivada",
	completed: "Completada",
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
	active: "default",
	archived: "secondary",
	completed: "outline",
};

export const columns: ColumnDef<NoteFormData>[] = [
	{
		accessorKey: "emoji",
		header: () => <div className="w-[30px]" />,
		cell: ({ row }) => {
			return <div className="w-[30px]">{row.getValue("emoji")}</div>;
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Título" />
		),
	},
	{
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Categoría" />
		),
	},
	{
		accessorKey: "priority",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Prioridad" />
		),
		cell: ({ row }) => {
			const priority = row.getValue("priority") as number;
			return (
				<Badge variant={PRIORITY_VARIANTS[priority]}>
					{PRIORITY_LABELS[priority]}
				</Badge>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Estado" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge variant={STATUS_VARIANTS[status] || "default"}>
					{STATUS_LABELS[status] || status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "content",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Contenido" />
		),
		cell: ({ row }) => {
			const content = row.getValue("content") as string;
			return <div className="max-w-[500px] truncate">{content}</div>;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];
