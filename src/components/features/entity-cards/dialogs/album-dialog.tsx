"use client";

import { AlbumCard } from "@/components/features/entity-cards/cards/album-card";
import { EntityCreationDialog } from "@/components/features/entity-cards/dialogs/entity-creation-dialog";
import { AlbumForm } from "@/components/features/entity-cards/forms/album-form";
import type { AlbumFormData } from "@/components/features/entity-cards/forms/entity-types";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger";
import { useAlbumsStore } from "@/store/entities/albums.store";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

const albumDialogLogger = logger.withContext("AlbumDialog");

export function AlbumDialog() {
	// Store de álbumes
	const { createAlbum, addImageToAlbum } = useAlbumsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<AlbumFormData>({
		name: "",
		emoji: "📷",
		color: "#3b82f6", // Azul predeterminado
		description: "",
		shortcut: "",
		sortBy: "name",
		filters: "",
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: AlbumFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado del álbum
	const handleSave = async (imageId: string | null) => {
		try {
			albumDialogLogger.info("📥 Guardando álbum", { formData });

			// Crear el álbum
			const savedAlbum = await createAlbum(formData);

			albumDialogLogger.info("✅ Álbum guardado", savedAlbum);

			// Si se proporcionó un ID de imagen, asociar el álbum con esa imagen
			if (imageId && savedAlbum) {
				albumDialogLogger.info("🔗 Asociando imagen a álbum", {
					imageId,
					albumId: savedAlbum.id,
				});

				await addImageToAlbum(imageId, savedAlbum.id);

				toast.success(`Se ha añadido la imagen al álbum "${savedAlbum.name}"`);
			}

			return savedAlbum;
		} catch (error) {
			albumDialogLogger.error("❌ Error al guardar el álbum", error);
			toast.error("Error al crear el álbum");
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: "",
			emoji: "📷",
			color: "#3b82f6",
			description: "",
			shortcut: "",
			sortBy: "name",
			filters: "",
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo álbum"
			eventName="open-create-album-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<AlbumForm data={formData} onChange={handleFormChange} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">
						Vista previa
					</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<AlbumCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del álbum. Los campos opcionales se
						mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
