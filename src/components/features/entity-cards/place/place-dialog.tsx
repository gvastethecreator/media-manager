'use client';

import { EntityCreationDialog } from '@/components/features/entity-cards/entity-creation-dialog';
import type { PlaceFormData } from '@/components/features/entity-cards/entity-types';
import { PlaceCard } from '@/components/features/entity-cards/place/place-card';
import { PlaceForm } from '@/components/features/entity-cards/place/place-form';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { usePlacesStore } from '@/store/entities/places.store';
import * as React from 'react';
import { useState } from 'react';

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
		shortcut: '',
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
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Estado para indicar si está cargando
	const [isLoading, setIsLoading] = useState(false);

	// Función para manejar el guardado del lugar
	const handleSave = async (imageId?: string | null) => {
		if (!formData.name.trim()) {
			return;
		}

		try {
			setIsLoading(true);
			placeDialogLogger.info('📥 Guardando lugar', { formData });

			// Crear el lugar
			const savedPlace = await createPlace(formData);

			placeDialogLogger.info('✅ Lugar guardado', savedPlace);

			// Si se proporcionó un ID de imagen, asociar el lugar con esa imagen
			if (imageId && savedPlace) {
				placeDialogLogger.info('🔗 Asociando imagen a lugar', {
					imageId,
				});

				await addImageToPlace(imageId, savedPlace.id);

				toastService.success(`Se ha añadido la imagen al lugar "${formData.name}"`);
			}

			// Reset form
			handleCancel();
			return savedPlace;
		} catch (error) {
			placeDialogLogger.error('❌ Error al guardar el lugar', error);
			toastService.error('Error al crear el lugar');
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Función para manejar la creación del formulario
	const handleFormSubmit = async (data: PlaceFormData) => {
		setFormData(data);
		setIsValid(!!data.name.trim());
		// No hacemos nada más aquí, el guardado real ocurre en handleSave
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: '',
			emoji: '🗺️',
			color: '#10b981',
			description: '',
			shortcut: '',
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
					<PlaceForm initialData={formData} onSubmit={handleFormSubmit} onCancel={handleCancel} isLoading={isLoading} />
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
