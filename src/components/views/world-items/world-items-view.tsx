import { Box } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { WorldItemCard } from '@/components/cards/world-item-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { useWorldItems } from '@/lib/api/world-items';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('WorldItemsView');

export function WorldItemsView(_props: ViewProps) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const selectWorldItem = useWorldItemStore((state) => state.selectWorldItem);

	const { data: worldItemsResponse, isLoading, error } = useWorldItems();
	const worldItems = worldItemsResponse?.data || [];

	const handleWorldItemClick = useCallback(
		(worldItem: any) => {
			viewLogger.info('🖱️ Click en objeto del mundo:', worldItem.name);
			navigateWithTransition('/world-item-content');
			selectWorldItem(worldItem.id);
		},
		[navigateWithTransition, selectWorldItem]
	);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
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
				description="Los objetos del mundo te ayudan a organizar tus imágenes. Crea un nuevo objeto del mundo desde el panel de configuración."
				icon={Box}
				title="No hay objetos del mundo"
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{worldItems.map((worldItem, index) => (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							initial={{ opacity: 0, y: 20 }}
							key={worldItem.id}
							transition={{ delay: index * 0.1 }}
						>
							<WorldItemCard className="h-full" onClick={handleWorldItemClick} worldItemId={worldItem.id} />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
