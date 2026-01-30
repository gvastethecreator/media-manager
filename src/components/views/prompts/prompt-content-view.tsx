import { Terminal } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { usePromptImages } from '@/lib/api/prompts';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { usePromptStore } from '@/store/entities/prompt/store';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('PromptContentView');

export function PromptContentView() {
	const selectedPrompt = usePromptStore((state) => state.selectedPrompt);
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const promptId = selectedPrompt?.id ?? null;
	const { data: images = [], isLoading, error } = usePromptImages(promptId || '');
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
		() => (selectedPrompt?.name ? `Imágenes del prompt: ${selectedPrompt.name}` : 'Selecciona un prompt'),
		[selectedPrompt?.name]
	);

	if (!promptId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona un prompt para ver sus imágenes relacionadas"
						icon={Terminal}
						title="Sin prompt seleccionado"
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
}
