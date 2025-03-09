"use client";

import { TagCard } from "@/components/features/entity-cards/cards/tag-card";
import { EntityCreationDialog } from "@/components/features/entity-cards/dialogs/entity-creation-dialog";
import type { TagFormData } from "@/components/features/entity-cards/forms/entity-types";
import { TagForm } from "@/components/features/entity-cards/forms/tag-form";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger";
import { useTagsStore } from "@/store/entities/tags.store";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

const tagDialogLogger = logger.withContext("TagDialog");

export function TagDialog() {
	// Store de etiquetas
	const { createTag, addTagToImage } = useTagsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<TagFormData>({
		name: "",
		color: "#10b981", // Verde predeterminado
		shortcut: "",
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: TagFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado de la etiqueta
	const handleSave = async (imageId: string | null) => {
		try {
			tagDialogLogger.info("📥 Guardando etiqueta", { formData });

			// Crear la etiqueta
			const savedTag = await createTag(formData);

			tagDialogLogger.info("✅ Etiqueta guardada", savedTag);

			// Si se proporcionó un ID de imagen, asociar la etiqueta con esa imagen
			if (imageId && savedTag) {
				tagDialogLogger.info("🔗 Asociando imagen a etiqueta", {
					imageId,
					tagId: savedTag.id,
				});

				await addTagToImage(imageId, savedTag.id);

				toast.success(
					`Se ha añadido la etiqueta "${savedTag.name}" a la imagen`
				);
			}

			return savedTag;
		} catch (error) {
			tagDialogLogger.error("❌ Error al guardar la etiqueta", error);
			toast.error("Error al crear la etiqueta");
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: "",
			color: "#10b981",
			shortcut: "",
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
					<TagForm data={formData} onChange={handleFormChange} />
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
						Esta es una previsualización de la etiqueta. Puedes ajustar el color
						y el nombre según necesites.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
