'use client';

import { WorldItemCard } from '@/components/features/entity-cards/cards/world-item-card';
import { EntityCreationDialog } from '@/components/features/entity-cards/dialogs/entity-creation-dialog';
import type { WorldItemFormData } from '@/components/features/entity-cards/forms/entity-types';
import { WorldItemForm } from '@/components/features/entity-cards/forms/world-item-form';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { useWorldItemsStore } from '@/store/entities/world-items.store';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

const worldItemDialogLogger = logger.withContext('WorldItemDialog');

export function WorldItemDialog() {
	// Store de objetos del mundo
	const { createWorldItem, addImageToWorldItem } = useWorldItemsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<WorldItemFormData>({
		name: '',
		emoji: '🧩',
		color: '#f97316', // Naranja predeterminado
		description: '',
		category: 'Otro',
		rarity: 'Común',
		origin: '',
		properties: '[]',
		requirements: '{}',
		stats: '{}',
		sortBy: 'name',
		filters: '[]',
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar el guardado del objeto del mundo
	const handleSave = async (imageId: string | null) => {
		try {
			worldItemDialogLogger.info('📥 Guardando objeto del mundo', { formData });

			// Crear el objeto del mundo
			const savedWorldItem = await createWorldItem(formData);

			worldItemDialogLogger.info('✅ Objeto del mundo guardado', savedWorldItem);

			// Si se proporcionó un ID de imagen, asociar el objeto del mundo con esa imagen
			if (imageId && savedWorldItem) {
				worldItemDialogLogger.info('🔗 Asociando imagen a objeto del mundo', {
					imageId,
					worldItemId: savedWorldItem.id,
				});

				await addImageToWorldItem(savedWorldItem.id, imageId);

				toast.success(`Se ha añadido la imagen al objeto "${savedWorldItem.name}"`);
			}

			return savedWorldItem;
		} catch (error) {
			worldItemDialogLogger.error('❌ Error al guardar el objeto del mundo', error);
			toast.error('Error al crear el objeto del mundo');
			throw error;
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
			category: 'Otro',
			rarity: 'Común',
			origin: '',
			properties: '[]',
			requirements: '{}',
			stats: '{}',
			sortBy: 'name',
			filters: '[]',
			isFavorite: false,
		});
		setIsValid(false);
	};

	// Función para manejar cambios en el formulario desde WorldItemForm
	const handleFormSubmit = (data: WorldItemFormData) => {
		setFormData(data);
		setIsValid(!!data.name.trim());
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo objeto del mundo"
			eventName="open-create-world-item-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<WorldItemForm initialData={formData} onSubmit={handleFormSubmit} isLoading={false} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<WorldItemCard worldItem={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del objeto del mundo. Los campos opcionales se mostrarán solo si contienen
						información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
