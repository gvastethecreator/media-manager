"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { CompactPicker } from "react-color";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { TagInput } from "@/components/ui/tag-input";
import { ImagePicker } from "@/components/ui/image-picker";
import { BaseEntityFormData } from "./entity-types";
import {
	type BaseFormData,
	type EntityFormProps,
	type FormField,
} from "@/types/form.types";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { ShortcutPicker } from "@/components/ui/shortcut-picker";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
	fields?: FormField[];
}

// Componente genérico del formulario
export function EntityForm<T extends BaseFormData>({
	title,
	submitLabel,
	initialData,
	onSubmit,
	onCancel,
	isLoading,
	fields = [],
}: EntityFormProps<T>) {
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries()) as T;

		// Convertir tags de string a array
		if (formData.has("tags")) {
			const tags = formData.get("tags") as string;
			if (tags) {
				(data as any).tags = tags.split(",").map((t) => t.trim());
			}
		}

		await onSubmit(data);
	};

	const renderField = (field: FormField) => {
		const value = initialData?.[field.name as keyof T];

		switch (field.type) {
			case "textarea":
				return (
					<Textarea
						key={field.name}
						name={field.name}
						placeholder={field.placeholder}
						defaultValue={value as string}
						required={field.required}
						className="min-h-[100px] resize-y"
					/>
				);
			case "select":
				return (
					<Select
						key={field.name}
						name={field.name}
						defaultValue={value as string}
					>
						<SelectTrigger>
							<SelectValue placeholder={field.placeholder} />
						</SelectTrigger>
						<SelectContent>
							{field.options?.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			case "tags":
				return (
					<TagInput
						key={field.name}
						name={field.name}
						placeholder={field.placeholder}
						defaultValue={value as string[]}
					/>
				);
			case "image":
				return (
					<ImagePicker
						key={field.name}
						name={field.name}
						defaultValue={value as string}
					/>
				);
			case "emoji":
				return (
					<EmojiPicker
						key={field.name}
						name={field.name}
						defaultValue={value as string}
					/>
				);
			case "color":
				return (
					<ColorPicker
						key={field.name}
						name={field.name}
						defaultValue={value as string}
					/>
				);
			case "shortcut":
				return (
					<ShortcutPicker
						key={field.name}
						name={field.name}
						defaultValue={value as string}
					/>
				);
			default:
				return (
					<Input
						key={field.name}
						type="text"
						name={field.name}
						placeholder={field.placeholder}
						defaultValue={value as string}
						required={field.required}
					/>
				);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{title}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Nombre</label>
						<Input
							type="text"
							name="name"
							placeholder="Nombre..."
							defaultValue={initialData?.name}
							required
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Descripción</label>
						<Textarea
							name="description"
							placeholder="Descripción..."
							defaultValue={initialData?.description}
							className="resize-y"
						/>
					</div>

					{fields.map((field) => (
						<div key={field.name} className="space-y-2">
							<label className="text-sm font-medium">{field.label}</label>
							{renderField(field)}
						</div>
					))}
				</CardContent>
				<CardFooter className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					)}
					<Button type="submit" disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{submitLabel}
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
