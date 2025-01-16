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
import { Separator } from "@/components/ui/separator";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { CompactPicker } from "react-color";
import { Loader2, XIcon, CheckIcon } from "lucide-react";
import type { CollectionFormData } from "./entity-types";

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
	const [formData, setFormData] = React.useState<CollectionFormData>(
		initialData || {
			name: "",
			emoji: "🌟",
			description: "",
			color: "#3b82f6",
			filters: "[]",
			sortBy: "name",
		}
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) return;
		await onSubmit(formData);
	};

	const handleColorChange = (color: { hex: string }) => {
		setFormData((prev) => ({ ...prev, color: color.hex }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-2">
				<div className="flex items-center gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-8 w-8"
								style={{
									backgroundColor: formData.color,
								}}
							>
								<span className="text-lg">{formData.emoji}</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" side="right" align="start">
							<EmojiPicker
								onEmojiSelect={(emoji: string) =>
									setFormData((prev) => ({
										...prev,
										emoji,
									}))
								}
							/>
							<Separator className="my-2" />
							<div className="p-2">
								<CompactPicker
									color={formData.color}
									onChange={handleColorChange}
								/>
							</div>
						</PopoverContent>
					</Popover>
					<Input
						placeholder="Nombre de la colección"
						value={formData.name}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
						className="h-8"
					/>
				</div>
				<Textarea
					placeholder="Descripción (opcional)"
					value={formData.description}
					onChange={(e) =>
						setFormData((prev) => ({
							...prev,
							description: e.target.value,
						}))
					}
					className="h-20 resize-none"
				/>
			</div>
			<div className="flex items-center justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onCancel}
						className="h-7 text-xs text-destructive hover:text-destructive/90"
					>
						<XIcon className="h-3.5 w-3.5 mr-1" />
						Cancelar
					</Button>
				)}
				<Button
					type="submit"
					variant="ghost"
					size="sm"
					disabled={isLoading || !formData.name.trim()}
					className="h-7 text-xs text-green-500 hover:text-green-600"
				>
					{isLoading ?
						<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
					:	<CheckIcon className="h-3.5 w-3.5 mr-1" />}
					{initialData ? "Guardar" : "Crear"}
				</Button>
			</div>
		</form>
	);
}
