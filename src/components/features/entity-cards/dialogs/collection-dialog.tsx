"use client";

import { CollectionCard } from "@/components/features/entity-cards/cards/collection-card";
import { EntityCreationDialog } from "@/components/features/entity-cards/dialogs/entity-creation-dialog";
import { CollectionForm } from "@/components/features/entity-cards/forms/collection-form";
import type { CollectionFormData } from "@/components/features/entity-cards/forms/entity-types";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger/logger";
import { useCollectionsStore } from "@/store/entities/collections.store";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

const collectionDialogLogger = logger.withContext("CollectionDialog");

export function CollectionDialog() {
	// Store de colecciones
	const { createCollection, addImageToCollection } = useCollectionsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<CollectionFormData>({
		name: "",
		emoji: "📁",
		color: "#3b82f6", // Azul predeterminado
		description: "",
		shortcut: "",
		sortBy: "name",
		filters: "",
		editions: "",
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: CollectionFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado de la colección
	const handleSave = async (imageId: string | null) => {
		try {
			collectionDialogLogger.info("📥 Guardando colección", { formData });

			// Crear la colección
			const savedCollection = await createCollection(formData);

			collectionDialogLogger.info("✅ Colección guardada", savedCollection);

			// Si se proporcionó un ID de imagen, asociar la colección con esa imagen
			if (imageId && savedCollection) {
				collectionDialogLogger.info("🔗 Asociando imagen a colección", {
					imageId,
					collectionId: savedCollection.id,
				});

				await addImageToCollection(imageId, savedCollection.id);

				toast.success(
					`Se ha añadido la imagen a la colección "${savedCollection.name}"`
				);
			}

			return savedCollection;
		} catch (error) {
			collectionDialogLogger.error("❌ Error al guardar la colección", error);
			toast.error("Error al crear la colección");
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: "",
			emoji: "📁",
			color: "#3b82f6",
			description: "",
			shortcut: "",
			sortBy: "name",
			filters: "",
			editions: "",
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nueva colección"
			eventName="open-create-collection-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<CollectionForm data={formData} onChange={handleFormChange} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">
						Vista previa
					</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<CollectionCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización de la colección. Los campos opcionales
						se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
