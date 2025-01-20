"use client";

import * as React from "react";
import { EntityForm } from "./entity-form";
import { type PromptFormData } from "@/stores/prompt-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PromptFormProps {
	initialData?: PromptFormData;
	onSubmit: (data: PromptFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const PROMPT_CATEGORIES = [
	"general",
	"character",
	"place",
	"object",
	"story",
	"system",
	"custom",
];

export function PromptForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: PromptFormProps) {
	return (
		<EntityForm<PromptFormData>
			title="Prompt"
			submitLabel={initialData ? "Actualizar" : "Crear"}
			initialData={initialData}
			onSubmit={onSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			fields={[
				{
					name: "content",
					label: "Contenido",
					type: "textarea",
					required: true,
					placeholder: "Escribe el contenido del prompt...",
				},
				{
					name: "type",
					label: "Tipo",
					type: "select",
					options: [
						{ value: "system", label: "Sistema" },
						{ value: "user", label: "Usuario" },
						{ value: "assistant", label: "Asistente" },
					],
				},
				{
					name: "tags",
					label: "Etiquetas",
					type: "tags",
					placeholder: "Agrega etiquetas...",
				},
			]}
		/>
	);
}
