'use client';

import { EntityCreationDialog } from '@/components/features/entity-cards/entity-creation-dialog';
import type { PromptFormData } from '@/components/features/entity-cards/entity-types';
import { formDataToPrompt } from '@/components/features/entity-cards/entity-types';
import { PromptCard } from '@/components/features/entity-cards/prompt/prompt-card';
import { PromptForm } from '@/components/features/entity-cards/prompt/prompt-form';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { usePromptStore } from '@/store/entities/prompt.store';
import * as React from 'react';
import { useState } from 'react';

const promptDialogLogger = logger.withContext('PromptDialog');

export function PromptDialog() {
	// Store de prompts
	const { createPrompt, addPromptToImage } = usePromptStore();

	// Estado para el formulario
	const [formData, setFormData] = useState<PromptFormData>({
		name: '',
		content: '',
		category: 'general',
		parameters: '',
		tags: [],
		color: '#6366f1', // Indigo predeterminado
		emoji: '💬',
		description: '',
		featuredImage: null,
		isFavorite: false,
	});

	// Estado para la validez del formulario
	const [isValid, setIsValid] = useState(false);

	// Estado para indicar si está cargando
	const [isLoading, setIsLoading] = useState(false);

	// Función para manejar cambios en el formulario
	const handleFormChange = (data: PromptFormData, valid: boolean) => {
		setFormData(data);
		setIsValid(valid);
	};

	// Función para manejar el guardado del prompt
	const handleSave = async (imageId?: string | null) => {
		if (!formData.name.trim()) {
			return;
		}

		try {
			setIsLoading(true);
			promptDialogLogger.info('📥 Guardando prompt', { formData });

			// Crear el prompt
			const savedPrompt = await createPrompt(formDataToPrompt(formData));

			promptDialogLogger.info('✅ Prompt guardado', savedPrompt);

			// Si se proporcionó un ID de imagen, asociar el prompt con esa imagen
			if (imageId && savedPrompt) {
				promptDialogLogger.info('🔗 Asociando imagen a prompt', {
					imageId,
					promptId: savedPrompt.id,
				});

				await addPromptToImage(imageId, savedPrompt.id);

				toastService.success(`Se ha añadido la imagen al prompt "${savedPrompt.name}"`);
			}

			// Reset form
			handleCancel();
			return savedPrompt;
		} catch (error) {
			promptDialogLogger.error('❌ Error al guardar el prompt', error);
			toastService.error('Error al crear el prompt');
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
			content: '',
			category: 'general',
			parameters: '',
			tags: [],
			color: '#6366f1',
			emoji: '💬',
			description: '',
			featuredImage: null,
			isFavorite: false,
		});
		setIsValid(false);
	};

	return (
		<EntityCreationDialog
			title="Crear nuevo prompt"
			eventName="open-create-prompt-dialog"
			isFormValid={isValid}
			onSave={handleSave}
			onCancel={handleCancel}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Formulario */}
				<div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
					<PromptForm
						initialData={formData}
						onSubmit={(data) => handleFormChange(data, isValid)}
						onCancel={handleCancel}
						isLoading={isLoading}
					/>
				</div>

				{/* Previsualización */}
				<div className="flex flex-col space-y-4">
					<h3 className="text-sm font-semibold text-muted-foreground">Vista previa</h3>
					<Separator />
					<div className="flex-1 rounded-lg border p-4">
						<PromptCard data={formData} isPreview={true} />
					</div>
					<p className="text-xs text-muted-foreground">
						Esta es una previsualización del prompt. Los campos opcionales se mostrarán solo si contienen información.
					</p>
				</div>
			</div>
		</EntityCreationDialog>
	);
}
