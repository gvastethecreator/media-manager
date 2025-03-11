"use client";

import { EntityCreationDialog } from "@/components/features/entity-cards/entity-creation-dialog";
import type { TagFormData } from "@/components/features/entity-cards/entity-types";
import { formDataToTag } from "@/components/features/entity-cards/entity-types";
import { TagCard } from "@/components/features/entity-cards/tag/tag-card";
import { TagForm } from "@/components/features/entity-cards/tag/tag-form";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger/logger";
import { toastService } from "@/lib/services/toast.service";
import { useTagsStore } from "@/store/entities/tags.store";
import * as React from "react";
import { useState } from "react";

const tagDialogLogger = logger.withContext("TagDialog");

export function TagDialog() {
	// Store de etiquetas
	const { createTag, addTagToImage } = useTagsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<TagFormData>({
		name: "",
		emoji: "🏷️",
		color: "#10b981", // Verde predeterminado
		shortcut: "",
		description: "",
		category: null,
		featuredImage: null,
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Estado para indicar si está cargando
	const [isLoading, setIsLoading] = useState(false);

	// Función para manejar el guardado de la etiqueta
	const handleSave = async (imageId?: string | null) => {
		if (!formData.name.trim()) {
			return;
		}

		try {
			setIsLoading(true);
			tagDialogLogger.info("📥 Guardando etiqueta", { formData });

			// Crear la etiqueta
			const savedTag = await createTag(formDataToTag(formData));

			tagDialogLogger.info("✅ Etiqueta guardada", savedTag);

			// Si se proporcionó un ID de imagen, asociar la etiqueta con esa imagen
			if (imageId && savedTag) {
				tagDialogLogger.info("🔗 Asociando imagen a etiqueta", {
					imageId,
				});

				await addTagToImage(imageId, savedTag.id);

				toastService.success(
					`Se ha añadido la etiqueta "${formData.name}" a la imagen`
				);
			}

			// Reset form
			handleCancel();
			return savedTag;
		} catch (error) {
			tagDialogLogger.error("❌ Error al guardar la etiqueta", error);
			toastService.error("Error al crear la etiqueta");
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Función para manejar la creación del formulario
	const handleFormSubmit = async (data: TagFormData) => {
		setFormData(data);
		setIsValid(!!data.name.trim());
		// No hacemos nada más aquí, el guardado real ocurre en handleSave
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: "",
			emoji: "🏷️",
			color: "#10b981",
			shortcut: "",
			description: "",
			category: null,
			featuredImage: null,
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nueva etiqueta"
			eventName="open-create-tag-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<TagForm
						initialData={formData}
						onSubmit={handleFormSubmit}
						onCancel={handleCancel}
						isLoading={isLoading}
					/>
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">
						Vista previa
					</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<TagCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización de la etiqueta. Los campos opcionales
						se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
