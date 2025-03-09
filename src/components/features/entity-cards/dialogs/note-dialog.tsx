"use client";

import { NoteCard } from "@/components/features/entity-cards/cards/note-card";
import { EntityCreationDialog } from "@/components/features/entity-cards/dialogs/entity-creation-dialog";
import type { NoteFormData } from "@/components/features/entity-cards/forms/entity-types";
import { NoteForm } from "@/components/features/entity-cards/forms/note-form";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger";
import { useNoteStore } from "@/store/entities/note.store";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

const noteDialogLogger = logger.withContext("NoteDialog");

export function NoteDialog() {
	// Store de notas
	const { createNote, addNoteToImage } = useNoteStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<NoteFormData>({
		name: "",
		emoji: "📝",
		color: "#3b82f6", // Azul predeterminado
		description: "",
		title: "",
		content: "",
		category: "personal",
		priority: 0,
		status: "draft",
		tags: [],
		featuredImage: null,
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: NoteFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado de la nota
	const handleSave = async (imageId: string | null) => {
		try {
			noteDialogLogger.info("📥 Guardando nota", { formData });

			// Crear la nota
			const savedNote = await createNote(formData);

			noteDialogLogger.info("✅ Nota guardada", savedNote);

			// Si se proporcionó un ID de imagen, asociar la nota con esa imagen
			if (imageId && savedNote) {
				noteDialogLogger.info("🔗 Asociando imagen a nota", {
					imageId,
					noteId: savedNote.id,
				});

				await addNoteToImage(imageId, savedNote.id);

				toast.success(`Se ha añadido la imagen a la nota "${savedNote.name}"`);
			}

			return savedNote;
		} catch (error) {
			noteDialogLogger.error("❌ Error al guardar la nota", error);
			toast.error("Error al crear la nota");
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: "",
			emoji: "📝",
			color: "#3b82f6",
			description: "",
			title: "",
			content: "",
			category: "personal",
			priority: 0,
			status: "draft",
			tags: [],
			featuredImage: null,
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nueva nota"
			eventName="open-create-note-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<NoteForm data={formData} onChange={handleFormChange} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">
						Vista previa
					</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<NoteCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización de la nota. Los campos opcionales se
						mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
