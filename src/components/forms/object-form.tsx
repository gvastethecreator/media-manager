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
	"Arma",
	"Armadura",
	"Accesorio",
	"Poción",
	"Pergamino",
	"Gema",
	"Reliquia",
	"Herramienta",
	"Contenedor",
	"Vestimenta",
	"Otro",
];

const OBJECT_RARITIES = [
	"Común",
	"Poco común",
	"Raro",
	"Muy raro",
	"Legendario",
	"Mítico",
];

export function ObjectForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: ObjectFormProps) {
	const extraFields = (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Tipo</label>
					<Select name="type">
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un tipo" />
						</SelectTrigger>
						<SelectContent>
							{OBJECT_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Rareza</label>
					<Select name="rarity">
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona rareza" />
						</SelectTrigger>
						<SelectContent>
							{OBJECT_RARITIES.map((rarity) => (
								<SelectItem key={rarity} value={rarity}>
									{rarity}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Propiedades (JSON)</label>
				<Textarea
					placeholder='["Mágico", "Indestructible", ...]'
					name="properties"
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Requisitos (JSON)</label>
				<Textarea
					placeholder='{"nivel": 5, "clase": "Mago", ...}'
					name="requirements"
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Origen</label>
				<Input
					placeholder="Origen del objeto..."
					name="origin"
					className="h-8"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Estadísticas (JSON)</label>
				<Textarea
					placeholder='{"daño": "2d6", "defensa": 5, ...}'
					name="stats"
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>
		</div>
	);

	return (
		<EntityForm<ObjectFormData>
			initialData={initialData}
			onSubmit={onSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title="Objeto"
			submitLabel={initialData ? "Actualizar" : "Crear"}
			extraFields={extraFields}
		/>
	);
}
