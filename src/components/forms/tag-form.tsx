"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompactPicker } from "react-color";
import { cn } from "@/lib/utils";
import { TagFormData } from "./entity-types";
import { Palette } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface TagFormProps {
	initialData?: TagFormData;
	onSubmit: (data: TagFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function TagForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: TagFormProps) {
	const [formData, setFormData] = React.useState<TagFormData>(
		initialData || {
			name: "",
			color: "#3b82f6",
			description: "",
			shortcut: "",
		}
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name?.trim()) return;
		await onSubmit(formData);
	};

	const handleChange = (field: keyof TagFormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="flex items-center gap-2">
				<div
					className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
					style={{ backgroundColor: formData.color }}
				>
					<Palette className="h-4 w-4 text-white/90" />
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
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-full"
						>
							<div
								className="h-4 w-4 rounded-full"
								style={{ backgroundColor: formData.color }}
							/>
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto p-0 bg-transparent border-none"
						align="end"
					>
						<CompactPicker
							color={formData.color}
							className="bg-black/90 text-white overflow-hidden"
							onChange={(color) => handleChange("color", color.hex)}
						/>
					</PopoverContent>
				</Popover>
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
