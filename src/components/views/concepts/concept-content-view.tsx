import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useConceptImages } from '@/lib/api/concepts';
import { clientLogger } from '@/lib/logger/client-logger';
import { selectSelectedConcept, useConceptStore } from '@/store/entities/concept';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const viewLogger = clientLogger.withContext('ConceptContentView');

export function ConceptContentView() {
	const selectedConcept = useConceptStore(selectSelectedConcept);
	const [items, setItems] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [currentConceptId, setCurrentConceptId] = useState(selectedConcept?.id);

	const { data: conceptImages, isLoading: isLoadingImages, error: conceptError } = useConceptImages(currentConceptId);

	const loadConceptImages = useCallback(async () => {
		if (!currentConceptId) return;

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del concepto...');
			if (conceptImages) {
				setItems(conceptImages as unknown as FileItem[]);
			}
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			viewLogger.error('❌ Error cargando imágenes del concepto:', errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentConceptId, conceptImages]);

	useEffect(() => {
		loadConceptImages();
	}, [loadConceptImages]);

	const toggleItemSelection = useCallback((item) => {
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
		setCurrentContainer: () => {}, // No es necesario en el nuevo enfoque
		emptyState: {
			icon: Lightbulb,
			title: 'Concepto vacío',
			description: `No se encontraron imágenes en ${
				selectedConcept?.name || 'este concepto'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
		onRefresh: loadConceptImages,
	};

	if (isLoading || isLoadingImages) {
		return <div className="flex items-center justify-center p-8">Cargando imágenes...</div>;
	}

	if (error || conceptError) {
		return (
			<div className="flex items-center justify-center p-8 text-red-500">Error: {error || conceptError?.message}</div>
		);
	}

	if (!items || items.length === 0) {
		return <div className="flex items-center justify-center p-8">No se encontraron imágenes</div>;
	}

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
