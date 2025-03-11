'use client';

import { ConceptCard } from '@/components/features/entity-cards/concept/concept-card';
import { EntityCreationDialog } from '@/components/features/entity-cards/entity-creation-dialog';
import type { ConceptFormData } from '@/components/features/entity-cards/entity-types';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { useConceptStore } from '@/store/entities/concept.store';
import * as React from 'react';
import { useState } from 'react';

const conceptDialogLogger = logger.withContext('ConceptDialog');

export function ConceptDialog() {
	// Store de conceptos
	const { createConcept, addConceptToImage } = useConceptStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<ConceptFormData>({
		name: '',
		emoji: '🔮',
		color: '#8b5cf6', // Morado predeterminado
		description: '',
		content: '',
		category: 'general',
		tags: [],
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Función para manejar el guardado del concepto
	const handleSave = async (imageId?: string | null) => {
		try {
			conceptDialogLogger.info('📥 Guardando concepto', { formData });

			// Crear el concepto
			const savedConcept = await createConcept({
				name: formData.name,
				emoji: formData.emoji,
				color: formData.color,
				description: formData.description || null,
				content: formData.content,
				category: formData.category,
				tags: Array.isArray(formData.tags) ? formData.tags.join(',') : '',
				featuredImage: formData.featuredImage || null,
			});

			conceptDialogLogger.info('✅ Concepto guardado', savedConcept);

			// Si se proporcionó un ID de imagen, asociar el concepto con esa imagen
			if (imageId && savedConcept) {
				conceptDialogLogger.info('🔗 Asociando imagen a concepto', {
					imageId,
					conceptId: savedConcept.id,
				});

				await addConceptToImage(imageId, savedConcept.id);

				toastService.success(`Se ha añadido la imagen al concepto "${savedConcept.name}"`);
			}
			handleCancel();
			return savedConcept;
		} catch (error) {
			conceptDialogLogger.error('❌ Error al guardar el concepto', error);
			toastService.error('Error al crear el concepto');
			throw error;
		}
	};

	// Función para manejar la cancelación
	const handleCancel = () => {
		// Restablecer el formulario
		setFormData({
			name: '',
			emoji: '🔮',
			color: '#8b5cf6',
			description: '',
			content: '',
			category: 'general',
			tags: [],
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo concepto"
			eventName="open-create-concept-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<div className="p-4 border rounded-md">
						<p className="text-muted-foreground text-center">Formulario de Concepto pendiente de implementar</p>
					</div>
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<ConceptCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del concepto. Los campos opcionales se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
