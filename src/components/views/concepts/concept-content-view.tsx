import { Lightbulb } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useConceptImages } from '@/lib/api/concepts';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { selectSelectedConcept, useConceptStore } from '@/store/entities/concept';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('ConceptContentView');

export const ConceptContentView = memo(function ConceptContentView() {
	const { id } = useParams<{ id: string }>();
	const selectedConcept = useConceptStore(selectSelectedConcept);
	const concepts = useConceptStore((state) => state.concepts);
	const selectConcept = useConceptStore((state) => state.selectConcept);
	const loadConcepts = useConceptStore((state) => state.loadConcepts);
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const routedConcept = id ? (concepts.find((concept) => concept.id === id) ?? null) : null;
	const effectiveConcept = routedConcept ?? selectedConcept;
	const conceptId = id || effectiveConcept?.id || null;

	useEffect(() => {
		if (id && routedConcept && routedConcept.id !== selectedConcept?.id) {
			selectConcept(routedConcept);
		}
	}, [id, routedConcept, selectConcept, selectedConcept?.id]);

	useEffect(() => {
		if (id && !routedConcept) {
			void loadConcepts();
		}
	}, [id, loadConcepts, routedConcept]);

	const { data: images = [], isLoading, error } = useConceptImages(conceptId || '');
	const browserItems = useMemo(
		() => images.map((img) => toBrowserItem(img as unknown as Record<string, unknown>)),
		[images]
	);

	const handleItemSelect = useCallback(
		(item: BrowserItem) => {
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;
			setSelectedItems([entity]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const headerTitle = useMemo(
		() => (effectiveConcept?.name ? `Imágenes del concepto: ${effectiveConcept.name}` : 'Selecciona un concepto'),
		[effectiveConcept?.name]
	);

	if (!conceptId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona un concepto para ver sus imágenes relacionadas"
						icon={Lightbulb}
						title="Sin concepto seleccionado"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView title={headerTitle}>
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if (isLoading && images.length === 0) {
		return (
			<BaseContentView title={headerTitle}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView description={images.length ? `${images.length} imágenes` : undefined} title={headerTitle}>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
});
