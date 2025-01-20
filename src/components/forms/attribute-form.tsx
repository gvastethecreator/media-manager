"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { AttributeFormData } from "./entity-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface AttributeFormProps {
	initialData?: AttributeFormData;
	onSubmit: (data: AttributeFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const ATTRIBUTE_TYPES = [
	"string",
	"number",
	"boolean",
	"date",
	"array",
	"object",
	"custom",
] as const;

const ATTRIBUTE_CATEGORIES = [
	"general",
	"character",
	"place",
	"object",
	"story",
	"system",
	"custom",
] as const;

export function AttributeForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: AttributeFormProps) {
	const handleSubmit = async (data: AttributeFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<AttributeFormData>
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? "Editar Atributo" : "Nuevo Atributo"}
			submitLabel={initialData ? "Guardar Cambios" : "Crear Atributo"}
			extraFields={
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Tipo</label>
							<Select defaultValue={initialData?.type || "string"}>
								<SelectTrigger>
									<SelectValue placeholder="Tipo de atributo" />
								</SelectTrigger>
								<SelectContent>
									{ATTRIBUTE_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Categoría</label>
							<Select defaultValue={initialData?.category || "general"}>
								<SelectTrigger>
									<SelectValue placeholder="Categoría" />
								</SelectTrigger>
								<SelectContent>
									{ATTRIBUTE_CATEGORIES.map((category) => (
										<SelectItem key={category} value={category}>
											{category.charAt(0).toUpperCase() + category.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Valor</label>
						<Textarea
							placeholder="Valor del atributo..."
							defaultValue={initialData?.value}
							className="font-mono"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Metadatos (JSON)</label>
						<Textarea
							placeholder="{ ... }"
							defaultValue={initialData?.metadata}
							className="font-mono"
						/>
					</div>
				</div>
			}
		/>
	);
}
