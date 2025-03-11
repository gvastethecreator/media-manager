'use client';

import { PlaceCard } from '@/components/features/entity-cards/cards/place-card';
import { EntityCreationDialog } from '@/components/features/entity-cards/dialogs/entity-creation-dialog';
import type { PlaceFormData } from '@/components/features/entity-cards/forms/entity-types';
import { PlaceForm } from '@/components/features/entity-cards/forms/place-form';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { usePlacesStore } from '@/store/entities/places.store';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

const placeDialogLogger = logger.withContext('PlaceDialog');

export function PlaceDialog() {
	// Store de lugares
	const { createPlace, addImageToPlace } = usePlacesStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<PlaceFormData>({
		name: '',
		emoji: '🗺️',
		color: '#10b981', // Verde predeterminado
		description: '',
		region: '',
		type: '',
		climate: '',
		population: 0,
		government: '',
		dangers: '',
		resources: '',
		lore: '',
		history: '',
		stats: '',
		sortBy: 'name',
		filters: '',
		shortcut: '',
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: PlaceFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado del lugar
	const handleSave = async (imageId: string | null) => {
		try {
			placeDialogLogger.info('📥 Guardando lugar', { formData });

			// Crear el lugar
			const savedPlace = await createPlace(formData);

			placeDialogLogger.info('✅ Lugar guardado', savedPlace);

			// Si se proporcionó un ID de imagen, asociar el lugar con esa imagen
			if (imageId && savedPlace) {
				placeDialogLogger.info('🔗 Asociando imagen a lugar', {
					imageId,
					placeId: savedPlace.id,
				});

				await addImageToPlace(imageId, savedPlace.id);

				toast.success(`Se ha añadido la imagen al lugar "${savedPlace.name}"`);
			}

			return savedPlace;
		} catch (error) {
			placeDialogLogger.error('❌ Error al guardar el lugar', error);
			toast.error('Error al crear el lugar');
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: '',
			emoji: '🗺️',
			color: '#10b981',
			description: '',
			region: '',
			type: '',
			climate: '',
			population: 0,
			government: '',
			dangers: '',
			resources: '',
			lore: '',
			history: '',
			stats: '',
			sortBy: 'name',
			filters: '',
			shortcut: '',
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo lugar"
			eventName="open-create-place-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<PlaceForm data={formData} onChange={handleFormChange} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<PlaceCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del lugar. Los campos opcionales se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
