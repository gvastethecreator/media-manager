import { GlobeIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { WorldItemCard } from '@/components/cards/world-item-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { motion } from '@/components/ui/animejs-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorldItems } from '@/lib/api/world-items';
import type { WorldItemWithStats } from '@/types/entities/world-item';

const WorldItemsContentView = () => {
	const { data, isLoading, error } = useWorldItems({
		limit: 48,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const items: WorldItemWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		// Asumiendo que el API ya devuelve datos con el formato correcto
		return list as WorldItemWithStats[];
	}, [data]);

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

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">World Items</h2>
				{items.length === 0 ? (
					<EmptyState description="Aún no has creado world items." icon={GlobeIcon} title="Sin world items" />
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{items.map((worldItem, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={worldItem.id}
								transition={{ delay: index * 0.02 }}
							>
								<WorldItemCard worldItemId={worldItem.id} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(WorldItemsContentView);
