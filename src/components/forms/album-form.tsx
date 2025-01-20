"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { AlbumFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface AlbumFormProps {
	initialData?: AlbumFormData;
	onSubmit: (data: AlbumFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function AlbumForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: AlbumFormProps) {
	const handleSubmit = async (data: AlbumFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<AlbumFormData>
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? "Editar Álbum" : "Nuevo Álbum"}
			submitLabel={initialData ? "Guardar Cambios" : "Crear Álbum"}
			extraFields={
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Ordenar Por</label>
						<Input
							value={initialData?.sortBy || "name"}
							placeholder="Campo de ordenamiento"
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
