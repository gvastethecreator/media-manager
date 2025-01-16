"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { PlaceFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PlaceFormProps {
	initialData?: PlaceFormData;
	onSubmit: (data: PlaceFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const PLACE_TYPES = [
	"Ciudad",
	"Pueblo",
	"Castillo",
	"Fortaleza",
	"Ruinas",
	"Mazmorra",
	"Bosque",
	"Montaña",
	"Desierto",
	"Costa",
	"Isla",
	"Templo",
	"Otro",
];

const CLIMATE_TYPES = [
	"Tropical",
	"Templado",
	"Continental",
	"Polar",
	"Árido",
	"Mediterráneo",
	"Montañoso",
	"Otro",
];

const GOVERNMENT_TYPES = [
	"Monarquía",
	"República",
	"Oligarquía",
	"Teocracia",
	"Anarquía",
	"Dictadura",
	"Consejo",
	"Otro",
];

export function PlaceForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: PlaceFormProps) {
	const extraFields = (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Región</label>
					<Input
						placeholder="Nombre de la región..."
						name="region"
						className="h-8"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Tipo</label>
					<Select name="type">
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un tipo" />
						</SelectTrigger>
						<SelectContent>
							{PLACE_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Clima</label>
					<Select name="climate">
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un clima" />
						</SelectTrigger>
						<SelectContent>
							{CLIMATE_TYPES.map((climate) => (
								<SelectItem key={climate} value={climate}>
									{climate}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Gobierno</label>
					<Select name="government">
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un gobierno" />
						</SelectTrigger>
						<SelectContent>
							{GOVERNMENT_TYPES.map((government) => (
								<SelectItem key={government} value={government}>
									{government}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Población</label>
				<Input
					type="number"
					min={0}
					placeholder="Número de habitantes..."
					name="population"
					className="h-8"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Peligros (JSON)</label>
				<Textarea
					placeholder='["Bandidos", "Monstruos", ...]'
					name="dangers"
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Recursos (JSON)</label>
				<Textarea
					placeholder='["Oro", "Madera", "Hierro", ...]'
					name="resources"
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Historia</label>
				<Textarea
					placeholder="Historia del lugar..."
					name="history"
					className="min-h-[100px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Leyendas y Mitos</label>
				<Textarea
					placeholder="Leyendas y mitos del lugar..."
					name="lore"
					className="min-h-[100px]"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium">Estadísticas (JSON)</label>
				<Textarea
					placeholder='{"defensa": 10, "comercio": 8, ...}'
					name="stats"
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>
		</div>
	);

	return (
		<EntityForm<PlaceFormData>
			initialData={initialData}
			onSubmit={onSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title="Lugar"
			submitLabel={initialData ? "Actualizar" : "Crear"}
			extraFields={extraFields}
		/>
	);
}
