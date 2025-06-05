'use client';

import { getPromptImages } from '@/app/actions/prompts/prompt.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePromptStore } from '@/store/entities/prompt/store';
import { Terminal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const viewLogger = clientLogger.withContext('PromptContentView');

export function PromptContentView() {
	const selectedPrompt = usePromptStore((state) => state.selectedPrompt);
	const [items, setItems] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const loadPromptImages = useCallback(async () => {
		if (!selectedPrompt) {
			setItems([]);
			return;
		}

		try {
			viewLogger.info('🔄 Cargando imágenes del prompt:', selectedPrompt.id);
			setIsLoading(true);
			const images = await getPromptImages(selectedPrompt.id);
			setItems(images);
			viewLogger.info(`✅ ${images.length} imágenes cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error cargando imágenes:', error);
			toast.error('Error al cargar las imágenes del prompt');
			setItems([]);
			setError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setIsLoading(false);
		}
	}, [selectedPrompt]);

	useEffect(() => {
		loadPromptImages();
	}, [loadPromptImages]);

	const toggleItemSelection = useCallback((item) => {
		// Implementar la lógica de selección de items si es necesaria
		viewLogger.info('🔄 Toggle selección de item:', item?.id);
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId: selectedPrompt?.id ?? null,
		containerName: selectedPrompt?.name ?? null,
		setCurrentContainer: () => {}, // No es necesario en el nuevo enfoque
		emptyState: {
			icon: Terminal,
			title: 'Prompt vacío',
			description: `No se encontraron imágenes en ${
				selectedPrompt?.name || 'este prompt'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
		onRefresh: loadPromptImages,
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
