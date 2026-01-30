import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { EmptyPanel } from './components/empty-panel';
import { MultiplePanel } from './components/multiple-panel';
import { SinglePanel } from './components/single-panel';
import { useEnhancedMetadata } from './hooks/use-enhanced-metadata';
import type { DetailsPanelProps } from './types';

export function DetailsPanel({ selectedItems, className = '' }: DetailsPanelProps) {
	const store = useUIStore();

	// Pasar explícitamente el item seleccionado (si existe) al hook de metadata mejorada
	const singleItem = selectedItems.length === 1 ? selectedItems[0] : undefined;
	const { enhancedMetadata, isLoadingMetadata } = useEnhancedMetadata(singleItem);

	const renderContent = () => {
		switch (selectedItems.length) {
			case 0:
				return <EmptyPanel />;
			case 1:
				return <SinglePanel enhancedMetadata={enhancedMetadata} item={selectedItems[0]} />;
			default:
				return <MultiplePanel items={selectedItems} />;
		}
	};

	return <div className={cn('flex h-full min-h-0 w-full min-w-0 flex-col', className)}>{renderContent()}</div>;
}

export default DetailsPanel;
