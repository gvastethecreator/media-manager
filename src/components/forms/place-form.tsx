"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { PlaceFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { ImagePicker } from "@/components/ui/image-picker";
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
	"city",
	"town",
	"village",
	"castle",
	"fortress",
	"dungeon",
	"temple",
	"ruins",
	"forest",
	"mountain",
	"desert",
	"island",
	"cave",
	"custom",
] as const;

const PLACE_CLIMATES = [
	"tropical",
	"temperate",
	"continental",
	"polar",
	"arid",
	"mediterranean",
	"custom",
] as const;

const PLACE_REGIONS = [
	"north",
	"south",
	"east",
	"west",
	"central",
	"coastal",
	"mountain",
	"forest",
	"desert",
	"island",
	"custom",
] as const;

export function PlaceForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: PlaceFormProps) {
	const handleSubmit = async (data: PlaceFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<PlaceFormData> 
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? "Editar Lugar" : "Nuevo Lugar"}
			submitLabel={initialData ? "Guardar Cambios" : "Crear Lugar"}
			extraFields={
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Nombre</label>
							<Input
								name="name"
								placeholder="Nombre del lugar"
								defaultValue={initialData?.name}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Emoji</label>
							<Input
								name="emoji"
								placeholder="🏰"
								defaultValue={initialData?.emoji || "🏰"}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Color</label>
							<Input
								type="color"
								name="color"
								defaultValue={initialData?.color || "#64748b"}
								className="h-10 px-2 py-1"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Tipo</label>
							<Select defaultValue={initialData?.type || "city"}>
								<SelectTrigger>
									<SelectValue placeholder="Tipo de lugar" />
								</SelectTrigger>
								<SelectContent>
									{PLACE_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Clima</label>
							<Select defaultValue={initialData?.climate || "temperate"}>
								<SelectTrigger>
									<SelectValue placeholder="Clima" />
								</SelectTrigger>
								<SelectContent>
									{PLACE_CLIMATES.map((climate) => (
										<SelectItem key={climate} value={climate}>
											{climate.charAt(0).toUpperCase() + climate.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Región</label>
							<Select defaultValue={initialData?.region || "central"}>
								<SelectTrigger>
									<SelectValue placeholder="Región" />
								</SelectTrigger>
								<SelectContent>
									{PLACE_REGIONS.map((region) => (
										<SelectItem key={region} value={region}>
											{region.charAt(0).toUpperCase() + region.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Descripción</label>
						<Textarea
							name="description"
							placeholder="Descripción del lugar..."
							defaultValue={initialData?.description}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Población</label>
							<Input
								type="number"
								placeholder="0"
								defaultValue={initialData?.population?.toString() || "0"}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Gobierno</label>
							<Input
								placeholder="Tipo de gobierno..."
								defaultValue={initialData?.government}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Peligros</label>
						<Textarea
							placeholder="Peligros del lugar..."
							defaultValue={initialData?.dangers}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Recursos</label>
						<Textarea
							placeholder="Recursos disponibles..."
							defaultValue={initialData?.resources}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Historia</label>
						<Textarea
							placeholder="Historia del lugar..."
							defaultValue={initialData?.history}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Leyendas</label>
						<Textarea
							placeholder="Leyendas y mitos..."
							defaultValue={initialData?.lore}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Estadísticas</label>
						<Textarea
							placeholder="Estadísticas del lugar..."
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

					<div className="space-y-2">
						<label className="text-sm font-medium">Etiquetas</label>
						<TagInput
							placeholder="Añade etiquetas..."
							defaultValue={initialData?.tags}
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Imagen Destacada</label>
						<ImagePicker
							defaultValue={initialData?.featuredImage}
						/>
					</div>
				</div>
			}
		/>
	);
}
