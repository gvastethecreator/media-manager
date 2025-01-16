"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { CompactPicker } from "react-color";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Tipos base para las entidades
export interface BaseEntityFormData {
	id?: string;
	name: string;
	emoji: string;
	color: string;
	description?: string;
	shortcut?: string;
	filters?: string;
	sortBy?: string;
}

// Props específicas para el formulario
export interface EntityFormProps<T extends BaseEntityFormData> {
	initialData?: T;
	onSubmit: (data: T) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
	title?: string;
	submitLabel?: string;
	className?: string;
	extraFields?: React.ReactNode;
}

// Componente genérico del formulario
export function EntityForm<T extends BaseEntityFormData>({
	initialData,
	onSubmit,
	onCancel,
	isLoading = false,
	title = "Nueva Entidad",
	submitLabel = "Guardar",
	className,
	extraFields,
}: EntityFormProps<T>) {
	const [formData, setFormData] = React.useState<T>(
		(initialData as T) ||
			({
				name: "",
				emoji: "🌟",
				color: "#3b82f6",
				description: "",
				shortcut: "",
				filters: "[]",
				sortBy: "name",
			} as T)
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name?.trim()) return;
		await onSubmit(formData);
	};

	const handleChange = (field: keyof T, value: string | number | boolean) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
			<div className="flex items-center gap-2">
				<div
					className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
					style={{ backgroundColor: formData.color }}
				>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
								<span className="text-lg">{formData.emoji}</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" align="start">
							<EmojiPicker
								onEmojiSelect={(emoji: string) => handleChange("emoji", emoji)}
							/>
							<Separator className="my-2" />
							<div className="p-2">
								<CompactPicker
									color={formData.color}
									onChange={(color) => handleChange("color", color.hex)}
								/>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex-1 min-w-0 space-y-1">
					<Input
						value={formData.name}
						onChange={(e) => handleChange("name", e.target.value)}
						className="h-8 text-base"
						placeholder="Nombre"
					/>
					<div className="flex gap-2">
						<Input
							value={formData.description || ""}
							onChange={(e) => handleChange("description", e.target.value)}
							className="h-6 text-xs"
							placeholder="Descripción (opcional)"
						/>
						<Input
							value={formData.shortcut || ""}
							onChange={(e) => handleChange("shortcut", e.target.value)}
							className="h-6 text-xs w-24"
							placeholder="Atajo"
						/>
					</div>
				</div>
			</div>

			{extraFields}

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
					{isLoading ? "Guardando..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}
