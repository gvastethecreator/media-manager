import { Box } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { WorldItemCard } from '@/components/cards/world-item-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorldItems } from '@/lib/api/world-items';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('WorldItemsView');

export function WorldItemsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const selectWorldItem = useWorldItemStore((state) => state.selectWorldItem);

	const { data: worldItemsResponse, isLoading, error } = useWorldItems();
	const worldItems = worldItemsResponse?.data || [];

	const handleWorldItemClick = useCallback(
		(worldItem: any) => {
			viewLogger.info('🖱️ Click en objeto del mundo:', worldItem.name);
			setCurrentView('world-item-content');
			selectWorldItem(worldItem.id);
		},
		[setCurrentView, selectWorldItem]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!worldItems || worldItems.length === 0) {
		return (
			<EmptyState
				icon={Box}
				title="No hay objetos del mundo"
				description="Los objetos del mundo te ayudan a organizar tus imágenes. Crea un nuevo objeto del mundo desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{worldItems.map((worldItem, index) => (
						<motion.div
							key={worldItem.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<WorldItemCard worldItem={worldItem} onClick={handleWorldItemClick} className="h-full" />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
