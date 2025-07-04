import { Lightbulb } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useConceptImages } from '@/lib/api/concepts';
import { clientLogger } from '@/lib/logger/client-logger';
import { selectSelectedConcept, useConceptStore } from '@/store/entities/concept';
import type { EntityWithStats } from '@/types/common/entity-with-stats';

const viewLogger = clientLogger.withContext('ConceptContentView');

export const ConceptContentView = memo(function ConceptContentView() {
	const selectedConcept = useConceptStore(selectSelectedConcept);
	const [items, setItems] = useState<EntityWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentConceptId, setCurrentConceptId] = useState(selectedConcept?.id);

	const { data: conceptImages, isLoading: isLoadingImages, error: conceptError } = useConceptImages(currentConceptId);

	const loadConceptImages = useCallback(async () => {
		if (!currentConceptId) return;

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del concepto...');
			if (conceptImages) {
				setItems(conceptImages as EntityWithStats[]);
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

	const emptyState = useMemo(
		() => ({
			icon: Lightbulb,
			title: 'Concepto vacío',
			description: `No se encontraron imágenes en ${
				selectedConcept?.name || 'este concepto'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		}),
		[selectedConcept?.name]
	);

	const contentProps: BaseContentProps = useMemo(
		() => ({
			items,
			isLoading,
			error,
			toggleItemSelection,
			currentContainerId: selectedConcept?.id ?? null,
			containerName: selectedConcept?.name ?? null,
			setCurrentContainer: () => {}, // No es necesario en el nuevo enfoque
			emptyState,
			onRefresh: loadConceptImages,
		}),
		[
			items,
			isLoading,
			error,
			toggleItemSelection,
			selectedConcept?.id,
			selectedConcept?.name,
			emptyState,
			loadConceptImages,
		]
	);

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
});
