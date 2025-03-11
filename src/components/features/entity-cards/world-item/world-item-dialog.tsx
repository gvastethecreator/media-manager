'use client';

import type { WorldItemCreate } from '@/app/actions/world-items/world-item.actions';
import { EntityCreationDialog } from '@/components/features/entity-cards/entity-creation-dialog';
import type { WorldItemFormData } from '@/components/features/entity-cards/entity-types';
import { WorldItemCard } from '@/components/features/entity-cards/world-item/world-item-card';
import { WorldItemForm } from '@/components/features/entity-cards/world-item/world-item-form';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { useWorldItemsStore } from '@/store/entities/world-items.store';
import * as React from 'react';
import { useState } from 'react';

const worldItemDialogLogger = logger.withContext('WorldItemDialog');

// Función para convertir de WorldItemFormData a WorldItemCreate
const formDataToWorldItem = (data: WorldItemFormData): WorldItemCreate => {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		category: data.category || undefined,
		type: data.type || null,
		rarity: data.rarity || null,
		properties: data.properties,
		requirements: data.requirements,
		origin: data.origin || null,
		stats: data.stats,
		featuredImage: data.featuredImage || null,
	};
};

export function WorldItemDialog() {
	// Store de objetos del mundo
	const { createWorldItem, addImageToWorldItem } = useWorldItemsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<WorldItemFormData>({
		name: '',
		emoji: '🧩',
		color: '#f97316', // Naranja predeterminado
		description: '',
		type: 'Item',
		category: 'Arma',
		rarity: 'Común',
		properties: '[]',
		requirements: '{}',
		origin: '',
		stats: '{}',
		sortBy: 'name',
		filters: '[]',
		shortcut: '',
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Estado para indicar si está cargando
	const [isLoading, setIsLoading] = useState(false);

	// Función para manejar el guardado del objeto
	const handleSave = async (imageId?: string | null) => {
		if (!formData.name.trim()) {
			return;
		}

		try {
			setIsLoading(true);
			worldItemDialogLogger.info('📥 Guardando objeto del mundo', { formData });

			// Crear el objeto, utilizando la función de conversión
			const savedWorldItem = await createWorldItem(formDataToWorldItem(formData));

			worldItemDialogLogger.info('✅ Objeto del mundo guardado', savedWorldItem);

			// Si se proporcionó un ID de imagen, asociar el objeto con esa imagen
			if (imageId && savedWorldItem) {
				worldItemDialogLogger.info('🔗 Asociando imagen a objeto del mundo', {
					imageId,
				});

				await addImageToWorldItem(imageId, savedWorldItem.id);

				toastService.success(`Se ha añadido la imagen al objeto "${formData.name}"`);
			}

			// Reset form
			handleCancel();
			return savedWorldItem;
		} catch (error) {
			worldItemDialogLogger.error('❌ Error al guardar el objeto del mundo', error);
			toastService.error('Error al crear el objeto del mundo');
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: '',
			emoji: '🧩',
			color: '#f97316',
			description: '',
			type: 'Item',
			category: 'Arma',
			rarity: 'Común',
			properties: '[]',
			requirements: '{}',
			origin: '',
			stats: '{}',
			sortBy: 'name',
			filters: '[]',
			shortcut: '',
			isFavorite: false,
		});
		setIsValid(false);
	};

	// Función para manejar la creación del formulario
	const handleFormSubmit = async (data: WorldItemFormData) => {
		setFormData(data);
		setIsValid(!!data.name.trim());
		// No hacemos nada más aquí, el guardado real ocurre en handleSave
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo objeto"
			eventName="open-create-world-item-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<WorldItemForm
						initialData={formData}
						onSubmit={handleFormSubmit}
						onCancel={handleCancel}
						isLoading={isLoading}
					/>
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<WorldItemCard worldItem={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del objeto. Los campos opcionales se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
