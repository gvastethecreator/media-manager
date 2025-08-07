import { useUIStore } from '@/store/ui.store';
import { EmptyPanel } from './components/empty-panel';
import { MultiplePanel } from './components/multiple-panel';
import { SinglePanel } from './components/single-panel';
import { useEnhancedMetadata } from './hooks/use-enhanced-metadata';
import type { DetailsPanelProps } from './types';

export function DetailsPanel({ selectedItems, className = '' }: DetailsPanelProps) {
	const store = useUIStore();

	const { enhancedMetadata, isLoadingMetadata } = useEnhancedMetadata();

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

	return <div className={`h-full w-full overflow-hidden ${className}`}>{renderContent()}</div>;
}

export default DetailsPanel;
