"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ConceptFormData } from "@/stores/concept-store";

const formSchema = z.object({
	name: z.string().min(1, "El nombre es requerido"),
	description: z.string().optional(),
	content: z.string().min(1, "El contenido es requerido"),
	type: z.string().optional(),
	tags: z.array(z.string()).default([]),
});

interface ConceptFormProps {
	initialData?: ConceptFormData;
	onSubmit: (data: ConceptFormData) => void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function ConceptForm({
	initialData,
	onSubmit,
	onCancel,
	isLoading,
}: ConceptFormProps) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: initialData?.name || "",
			description: initialData?.description || "",
			content: initialData?.content || "",
			type: initialData?.type || "default",
			tags: initialData?.tags || [],
		},
	});

	const handleSubmit = (data: z.infer<typeof formSchema>) => {
		onSubmit(data);
		if (!initialData) {
			form.reset();
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Nombre del concepto" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Input placeholder="Descripción del concepto" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contenido</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Contenido del concepto"
									className="min-h-[100px]"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tipo</FormLabel>
							<FormControl>
								<Input placeholder="Tipo de concepto" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end gap-4">
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isLoading}
						>
							Cancelar
						</Button>
					)}
					<Button type="submit" disabled={isLoading}>
						{isLoading ?
							"Guardando..."
						: initialData ?
							"Guardar cambios"
						:	"Crear concepto"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
