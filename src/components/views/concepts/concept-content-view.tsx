import { Lightbulb } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { BaseContentView } from '@/components/views/base';
import { useConceptImages } from '@/lib/api/concepts';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { selectSelectedConcept, useConceptStore } from '@/store/entities/concept';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('ConceptContentView');

export const ConceptContentView = memo(function ConceptContentView() {
	const selectedConcept = useConceptStore(selectSelectedConcept);
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const conceptId = selectedConcept?.id ?? null;
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
		() => (selectedConcept?.name ? `Imágenes del concepto: ${selectedConcept.name}` : 'Selecciona un concepto'),
		[selectedConcept?.name]
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
				<div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>
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
