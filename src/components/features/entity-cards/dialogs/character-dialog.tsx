'use client';

import { CharacterCard } from '@/components/features/entity-cards/cards/character-card';
import { EntityCreationDialog } from '@/components/features/entity-cards/dialogs/entity-creation-dialog';
import { CharacterForm } from '@/components/features/entity-cards/forms/character-form';
import type { CharacterFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { useCharactersStore } from '@/store/entities/characters.store';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

const characterDialogLogger = logger.withContext('CharacterDialog');

export function CharacterDialog() {
	// Store de personajes
	const { createCharacter, addImageToCharacter } = useCharactersStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<CharacterFormData>({
		name: '',
		emoji: '👤',
		color: '#ec4899', // Rosa predeterminado
		description: '',
		level: 1,
		class: '',
		race: '',
		alignment: '',
		backstory: '',
		stats: '',
		sortBy: 'name',
		filters: '',
		psychologicalProfile: '',
		socialProfile: '',
		relationships: '',
		goals: '',
		fears: '',
		beliefs: '',
		personality: '',
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: CharacterFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado del personaje
	const handleSave = async (imageId: string | null) => {
		try {
			characterDialogLogger.info('📥 Guardando personaje', { formData });

			// Crear el personaje
			const savedCharacter = await createCharacter(formData);

			characterDialogLogger.info('✅ Personaje guardado', savedCharacter);

			// Si se proporcionó un ID de imagen, asociar el personaje con esa imagen
			if (imageId && savedCharacter) {
				characterDialogLogger.info('🔗 Asociando imagen a personaje', {
					imageId,
					characterId: savedCharacter.id,
				});

				await addImageToCharacter(imageId, savedCharacter.id);

				toast.success(`Se ha añadido la imagen al personaje "${savedCharacter.name}"`);
			}

			return savedCharacter;
		} catch (error) {
			characterDialogLogger.error('❌ Error al guardar el personaje', error);
			toast.error('Error al crear el personaje');
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: '',
			emoji: '👤',
			color: '#ec4899',
			description: '',
			level: 1,
			class: '',
			race: '',
			alignment: '',
			backstory: '',
			stats: '',
			sortBy: 'name',
			filters: '',
			psychologicalProfile: '',
			socialProfile: '',
			relationships: '',
			goals: '',
			fears: '',
			beliefs: '',
			personality: '',
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
					<CharacterForm data={formData} onChange={handleFormChange} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<CharacterCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del personaje. Los campos opcionales se mostrarán solo si contienen
						información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
