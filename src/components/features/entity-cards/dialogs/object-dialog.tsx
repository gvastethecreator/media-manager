'use client';

import { ObjectCard } from '@/components/features/entity-cards/cards/object-card';
import { EntityCreationDialog } from '@/components/features/entity-cards/dialogs/entity-creation-dialog';
import type { ObjectFormData } from '@/components/features/entity-cards/forms/entity-types';
import { ObjectForm } from '@/components/features/entity-cards/forms/object-form';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';
import { useObjectsStore } from '@/store/objects.store';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

const objectDialogLogger = logger.withContext('ObjectDialog');

export function ObjectDialog() {
	// Store de objetos
	const { createObject, addImageToObject } = useObjectsStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<ObjectFormData>({
		name: '',
		emoji: '🧩',
		color: '#f97316', // Naranja predeterminado
		description: '',
		category: '',
		type: '',
		rarity: '',
		origin: '',
		materials: '',
		properties: '',
		requirements: '',
		history: '',
		usage: '',
		notes: '',
		shortcut: '',
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: ObjectFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado del objeto
	const handleSave = async (imageId: string | null) => {
		try {
			objectDialogLogger.info('📥 Guardando objeto', { formData });

			// Crear el objeto
			const savedObject = await createObject(formData);

			objectDialogLogger.info('✅ Objeto guardado', savedObject);

			// Si se proporcionó un ID de imagen, asociar el objeto con esa imagen
			if (imageId && savedObject) {
				objectDialogLogger.info('🔗 Asociando imagen a objeto', {
					imageId,
					objectId: savedObject.id,
				});

				await addImageToObject(imageId, savedObject.id);

				toast.success(`Se ha añadido la imagen al objeto "${savedObject.name}"`);
			}

			return savedObject;
		} catch (error) {
			objectDialogLogger.error('❌ Error al guardar el objeto', error);
			toast.error('Error al crear el objeto');
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
			category: '',
			type: '',
			rarity: '',
			origin: '',
			materials: '',
			properties: '',
			requirements: '',
			history: '',
			usage: '',
			notes: '',
			shortcut: '',
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo objeto"
			eventName="open-create-object-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<ObjectForm data={formData} onChange={handleFormChange} />
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<ObjectCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del objeto. Los campos opcionales se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
