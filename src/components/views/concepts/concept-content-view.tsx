'use client';

import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getConceptImages } from '@/app/actions/concepts/concept.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientLogger } from '@/lib/logger/client-logger';
import { selectSelectedConcept, useConceptStore } from '@/store/entities/concept';

const viewLogger = clientLogger.withContext('ConceptContentView');

export function ConceptContentView() {
	const selectedConcept = useConceptStore(selectSelectedConcept);
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadConceptImages = useCallback(async () => {
		if (!selectedConcept) {
			setItems([]);
			return;
		}

		try {
			viewLogger.info('🔄 Cargando imágenes del concepto:', selectedConcept.id);
			setIsLoading(true);
			const images = await getConceptImages(selectedConcept.id);
			setItems(images);
			viewLogger.info(`✅ ${images.length} imágenes cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error cargando imágenes:', error);
			toast.error('Error al cargar las imágenes del concepto');
			setItems([]);
			setError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setIsLoading(false);
		}
	}, [selectedConcept]);

	useEffect(() => {
		loadConceptImages();
	}, [loadConceptImages]);

	const toggleItemSelection = useCallback((item: FileItem) => {
		// Implementar la lógica de selección de items si es necesaria
		viewLogger.info('🔄 Toggle selección de item:', item?.id);
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId: selectedConcept?.id ?? null,
		containerName: selectedConcept?.name ?? null,
		setCurrentContainer: async () => {}, // No es necesario en el nuevo enfoque
		emptyState: {
			icon: Lightbulb,
			title: 'Concepto vacío',
			description: `No se encontraron imágenes en ${
				selectedConcept?.name || 'este concepto'
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
