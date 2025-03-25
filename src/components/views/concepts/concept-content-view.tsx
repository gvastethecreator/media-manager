'use client';

import { getConceptImages } from '@/app/actions/concepts/concept.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const viewLogger = serverLogger.withContext('ConceptContentView');

export function ConceptContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentConceptId,
		setCurrentConcept,
		isLoading,
		currentConcept,
		setItems,
		setIsLoading,
	} = useFileManager();

	const loadConceptImages = useCallback(async () => {
		if (!currentConceptId) {
			setItems([]);
			return;
		}

		try {
			viewLogger.info('🔄 Cargando imágenes del concepto:', currentConceptId);
			setIsLoading(true);
			const images = await getConceptImages(currentConceptId);
			setItems(images);
			viewLogger.info(`✅ ${images.length} imágenes cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error cargando imágenes:', error);
			toast.error('Error al cargar las imágenes del concepto');
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	}, [currentConceptId, setIsLoading, setItems]);

	useEffect(() => {
		loadConceptImages();
	}, [loadConceptImages]);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		toggleItemSelection,
		currentContainerId: currentConceptId ?? null,
		containerName: currentConcept?.name ?? null,
		setCurrentContainer: setCurrentConcept,
		emptyState: {
			icon: Lightbulb,
			title: 'Concepto vacío',
			description: `No se encontraron imágenes en ${currentConcept?.name || 'este concepto'
				}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
		onRefresh: loadConceptImages,
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
