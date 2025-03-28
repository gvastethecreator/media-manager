'use client';

import { getPromptImages } from '@/app/actions/prompts/prompt.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { Terminal } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const viewLogger = serverLogger.withContext('PromptContentView');

export function PromptContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentPromptId,
		setCurrentPrompt,
		isLoading,
		currentPrompt,
		setItems,
		setIsLoading,
	} = useFileManager();

	const loadPromptImages = useCallback(async () => {
		if (!currentPromptId) {
			setItems([]);
			return;
		}

		try {
			viewLogger.info('🔄 Cargando imágenes del prompt:', currentPromptId);
			setIsLoading(true);
			const images = await getPromptImages(currentPromptId);
			setItems(images);
			viewLogger.info(`✅ ${images.length} imágenes cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error cargando imágenes:', error);
			toast.error('Error al cargar las imágenes del prompt');
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	}, [currentPromptId, setIsLoading, setItems]);

	useEffect(() => {
		loadPromptImages();
	}, [loadPromptImages]);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		toggleItemSelection,
		currentContainerId: currentPromptId ?? null,
		containerName: currentPrompt?.name ?? null,
		setCurrentContainer: setCurrentPrompt,
		emptyState: {
			icon: Terminal,
			title: 'Prompt vacío',
			description: `No se encontraron imágenes en ${
				currentPrompt?.name || 'este prompt'
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
