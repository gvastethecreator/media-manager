"use client";

import { CharacterCard } from "@/components/features/entity-cards/character/character-card";
import { CharacterForm } from "@/components/features/entity-cards/character/character-form";
import { EntityCreationDialog } from "@/components/features/entity-cards/entity-creation-dialog";
import type { CharacterFormData } from "@/components/features/entity-cards/entity-types";
import { formDataToCharacter } from "@/components/features/entity-cards/entity-types";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger/logger";
import { toastService } from "@/lib/services/toast.service";
import { useCharactersStore } from "@/store/entities/characters.store";
import * as React from "react";
import { useState } from "react";

const characterDialogLogger = logger.withContext("CharacterDialog");

export function CharacterDialog() {
	// Store de personajes
	const { createCharacter, addImageToCharacter } = useCharactersStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<CharacterFormData>({
		name: "",
		emoji: "👤",
		color: "#ec4899", // Rosa predeterminado
		description: "",
		level: 1,
		class: "",
		race: "",
		alignment: "",
		backstory: "",
		stats: "",
		sortBy: "name",
		filters: "",
		psychologicalProfile: "",
		socialProfile: "",
		relationships: "",
		goals: "",
		fears: "",
		beliefs: "",
		personality: "",
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Estado para indicar si está cargando
	const [isLoading, setIsLoading] = useState(false);

	// Función para manejar cambios en el formulario
	const _handleFormChange = (data: CharacterFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar la creación del formulario
	const handleFormSubmit = async (data: CharacterFormData) => {
		setFormData(data);
		setIsValid(!!data.name.trim());
		// No hacemos nada más aquí, el guardado real ocurre en handleSave
	};

	// Función para manejar el guardado del personaje
	const handleSave = async (imageId?: string | null) => {
		if (!formData.name.trim()) {
			return;
		}

		try {
			setIsLoading(true);
			characterDialogLogger.info("📥 Guardando personaje", { formData });

			// Crear el personaje
			const savedCharacter = await createCharacter(
				formDataToCharacter(formData)
			);

			characterDialogLogger.info("✅ Personaje guardado", savedCharacter);

			// Si se proporcionó un ID de imagen, asociar el personaje con esa imagen
			if (imageId && savedCharacter) {
				characterDialogLogger.info("🔗 Asociando imagen a personaje", {
					imageId,
					characterId: savedCharacter.id,
				});

				await addImageToCharacter(imageId, savedCharacter.id);

				toastService.success(
					`Se ha añadido la imagen al personaje "${savedCharacter.name}"`
				);
			}

			// Reset form
			handleCancel();
			return savedCharacter;
		} catch (error) {
			characterDialogLogger.error("❌ Error al guardar el personaje", error);
			toastService.error("Error al crear el personaje");
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: "",
			emoji: "👤",
			color: "#ec4899",
			description: "",
			level: 1,
			class: "",
			race: "",
			alignment: "",
			backstory: "",
			stats: "",
			sortBy: "name",
			filters: "",
			psychologicalProfile: "",
			socialProfile: "",
			relationships: "",
			goals: "",
			fears: "",
			beliefs: "",
			personality: "",
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo personaje"
			eventName="open-create-character-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<CharacterForm
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
						<CharacterCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del personaje. Los campos opcionales se
						mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
