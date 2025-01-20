"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { CollectionFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CollectionFormProps {
	initialData?: CollectionFormData;
	onSubmit: (data: CollectionFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function CollectionForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading = false,
}: CollectionFormProps) {
	const handleSubmit = async (data: CollectionFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<CollectionFormData>
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? "Editar Colección" : "Nueva Colección"}
			submitLabel={initialData ? "Guardar Cambios" : "Crear"}
			extraFields={
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">URL</label>
							<Input
								name="url"
								placeholder="URL de la colección"
								defaultValue={initialData?.url}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">URL Alternativa</label>
							<Input
								name="alternativeUrl"
								placeholder="URL alternativa"
								defaultValue={initialData?.alternativeUrl}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Imagen de Origen</label>
							<Input
								name="sourceImage"
								placeholder="Imagen de origen"
								defaultValue={initialData?.sourceImage}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Plataforma</label>
							<Input
								name="platform"
								placeholder="Plataforma"
								defaultValue={initialData?.platform}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Precio</label>
							<Input
								type="number"
								name="price"
								placeholder="Precio"
								defaultValue={initialData?.price?.toString()}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Ordenar Por</label>
							<Input
								name="sortBy"
								placeholder="Campo de ordenamiento"
								defaultValue={initialData?.sortBy || "name"}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Ediciones (JSON)</label>
						<Textarea
							name="editions"
							placeholder="[]"
							defaultValue={initialData?.editions}
							className="font-mono text-sm"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Filtros (JSON)</label>
						<Textarea
							name="filters"
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
