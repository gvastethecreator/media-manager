import { Terminal } from 'lucide-react';
import { useCallback } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { usePromptImages } from '@/lib/api/prompts';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePromptStore } from '@/store/entities/prompt/store';
import type { EntityWithStats } from '@/types/entities/entity.types';

const viewLogger = clientLogger.withContext('PromptContentView');

export function PromptContentView() {
	const selectedPrompt = usePromptStore((state) => state.selectedPrompt);

	// Usar React Query hook en lugar de server action
	const { data: images = [], isLoading, error, refetch: loadPromptImages } = usePromptImages(selectedPrompt?.id || '');

	const toggleItemSelection = useCallback((item: EntityWithStats) => {
		// Implementar la lógica de selección de items si es necesaria
		viewLogger.info('🔄 Toggle selección de item:', item?.id);
	}, []);

	const handleRefresh = useCallback(async () => {
		viewLogger.info('🔄 Refrescando imágenes del prompt:', selectedPrompt?.id);
		await loadPromptImages();
	}, [loadPromptImages, selectedPrompt?.id]);

	const contentProps: BaseContentProps = {
		items: images,
		isLoading,
		error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
		toggleItemSelection,
		currentContainerId: selectedPrompt?.id ?? null,
		containerName: selectedPrompt?.name ?? null,
		setCurrentContainer: async (_id: string) => {}, // No es necesario en el nuevo enfoque
		emptyState: {
			icon: Terminal,
			title: 'Prompt vacío',
			description: `No se encontraron imágenes en ${
				selectedPrompt?.name || 'este prompt'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
		onRefresh: handleRefresh,
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView>
				{/* Prompt content will be added here */}
				<div className="p-4">
					<p>Contenido del prompt se mostrará aquí</p>
				</div>
			</BaseContentView>
		</ContentViewProvider>
	);
}
