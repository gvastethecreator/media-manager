"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { CompactPicker } from "react-color";
import { useState } from "react";
import { Label } from "@/components/ui/label";

const PROMPT_CATEGORIES = [
	{ value: "general", label: "General" },
	{ value: "character", label: "Personaje" },
	{ value: "scene", label: "Escena" },
	{ value: "story", label: "Historia" },
	{ value: "dialogue", label: "Diálogo" },
	{ value: "description", label: "Descripción" },
	{ value: "action", label: "Acción" },
];

interface PromptFormData {
	name: string;
	emoji: string;
	color: string;
	description: string;
	content: string;
	category: string;
	parameters: Record<string, any>;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

interface PromptFormProps {
	initialData?: Partial<PromptFormData>;
	onSubmit: (data: PromptFormData) => void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function PromptForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: PromptFormProps) {
	const [formData, setFormData] = useState<PromptFormData>({
		name: initialData?.name || "",
		emoji: initialData?.emoji || "🎯",
		color: initialData?.color || "#3b82f6",
		description: initialData?.description || "",
		content: initialData?.content || "",
		category: initialData?.category || "general",
		parameters: initialData?.parameters || {},
		tags: initialData?.tags || [],
		featuredImage: initialData?.featuredImage || null,
		isFavorite: initialData?.isFavorite || false,
	});

	const [parametersError, setParametersError] = useState<string>("");
	const [tagsError, setTagsError] = useState<string>("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			alert("El nombre es requerido");
			return;
		}
		onSubmit(formData);
	};

	const handleChange = (field: keyof PromptFormData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleParametersChange = (value: string) => {
		try {
			const parsedParameters = JSON.parse(value);
			if (typeof parsedParameters === "object" && parsedParameters !== null) {
				handleChange("parameters", parsedParameters);
				setParametersError("");
			} else {
				setParametersError("Los parámetros deben ser un objeto JSON válido");
			}
		} catch (error) {
			setParametersError("JSON inválido");
		}
	};

	const handleTagsChange = (value: string) => {
		try {
			const parsedTags = JSON.parse(value);
			if (Array.isArray(parsedTags)) {
				handleChange("tags", parsedTags);
				setTagsError("");
			} else {
				setTagsError("Los tags deben ser un array de strings");
			}
		} catch (error) {
			setTagsError("JSON inválido");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="flex items-center space-x-4">
				<Popover>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-12 h-12 text-2xl"
						>
							{formData.emoji}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="p-0">
						<EmojiPicker
							onEmojiSelect={(emoji: string) => {
								handleChange("emoji", emoji);
							}}
						/>
					</PopoverContent>
				</Popover>

				<Popover>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-12 h-12"
							style={{ backgroundColor: formData.color }}
						/>
					</PopoverTrigger>
					<PopoverContent className="p-0">
						<CompactPicker
							color={formData.color}
							onChange={(color) => {
								handleChange("color", color.hex);
							}}
						/>
					</PopoverContent>
				</Popover>

				<Input
					placeholder="Nombre del prompt"
					value={formData.name}
					onChange={(e) => handleChange("name", e.target.value)}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label>Descripción</Label>
				<Textarea
					value={formData.description}
					onChange={(e) => handleChange("description", e.target.value)}
					placeholder="Descripción (opcional)"
				/>
			</div>

			<div className="space-y-2">
				<Label>Contenido</Label>
				<Textarea
					value={formData.content}
					onChange={(e) => handleChange("content", e.target.value)}
					className="min-h-[200px]"
					placeholder="Contenido del prompt..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Categoría</Label>
				<Select
					value={formData.category}
					onValueChange={(value) => handleChange("category", value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Selecciona categoría" />
					</SelectTrigger>
					<SelectContent>
						{PROMPT_CATEGORIES.map((category) => (
							<SelectItem key={category.value} value={category.value}>
								{category.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label>Parámetros (JSON)</Label>
				<Textarea
					value={JSON.stringify(formData.parameters, null, 2)}
					onChange={(e) => handleParametersChange(e.target.value)}
					className="font-mono text-sm min-h-[120px]"
					placeholder='{
  "temperature": 0.7,
  "max_tokens": 150,
  "top_p": 1
}'
				/>
				{parametersError && (
					<p className="text-red-500 text-sm mt-1">{parametersError}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label>Etiquetas (JSON)</Label>
				<Textarea
					value={JSON.stringify(formData.tags, null, 2)}
					onChange={(e) => handleTagsChange(e.target.value)}
					className="font-mono text-sm min-h-[80px]"
					placeholder='["tag1", "tag2", ...]'
				/>
				{tagsError && <p className="text-red-500 text-sm mt-1">{tagsError}</p>}
			</div>

			<div className="flex justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						variant="ghost"
						onClick={onCancel}
						disabled={isLoading}
					>
						Cancelar
					</Button>
				)}
				<Button type="submit" disabled={isLoading || !formData.name.trim()}>
					{isLoading ?
						"Guardando..."
					: initialData ?
						"Actualizar"
					:	"Crear"}
				</Button>
			</div>
		</form>
	);
}
