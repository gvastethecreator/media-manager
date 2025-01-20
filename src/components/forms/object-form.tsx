"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { ObjectFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ObjectFormProps {
	initialData?: ObjectFormData;
	onSubmit: (data: ObjectFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const OBJECT_TYPES = [
	"weapon",
	"armor",
	"tool",
	"potion",
	"scroll",
	"ring",
	"wand",
	"staff",
	"book",
	"container",
	"vehicle",
	"artifact",
	"custom",
];

const OBJECT_RARITIES = [
	"common",
	"uncommon",
	"rare",
	"very-rare",
	"legendary",
	"artifact",
	"unique",
];

export function ObjectForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: ObjectFormProps) {
	const handleSubmit = async (data: ObjectFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<ObjectFormData>
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? "Editar Objeto" : "Nuevo Objeto"}
			submitLabel={initialData ? "Guardar Cambios" : "Crear Objeto"}
			extraFields={
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Tipo</label>
							<Select defaultValue={initialData?.type || "weapon"}>
								<SelectTrigger>
									<SelectValue placeholder="Tipo de objeto" />
								</SelectTrigger>
								<SelectContent>
									{OBJECT_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Rareza</label>
							<Select defaultValue={initialData?.rarity || "common"}>
								<SelectTrigger>
									<SelectValue placeholder="Rareza" />
								</SelectTrigger>
								<SelectContent>
									{OBJECT_RARITIES.map((rarity) => (
										<SelectItem key={rarity} value={rarity}>
											{rarity.charAt(0).toUpperCase() + rarity.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Propiedades</label>
						<Textarea
							placeholder="Propiedades del objeto..."
							defaultValue={initialData?.properties}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Requisitos</label>
						<Textarea
							placeholder="Requisitos para usar el objeto..."
							defaultValue={initialData?.requirements}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Origen</label>
						<Textarea
							placeholder="Origen del objeto..."
							defaultValue={initialData?.origin}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Estadísticas</label>
						<Textarea
							placeholder="Estadísticas del objeto..."
							defaultValue={initialData?.stats}
							className="font-mono"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Ordenar Por</label>
						<Input
							placeholder="Campo de ordenamiento"
							defaultValue={initialData?.sortBy || "name"}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Filtros (JSON)</label>
						<Textarea
							placeholder="[]"
							defaultValue={initialData?.filters}
							className="font-mono text-sm"
						/>
					</div>
				</div>
			}
		/>
	);
}
