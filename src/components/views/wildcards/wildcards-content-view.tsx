import { SparklesIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { WildcardCard } from '@/components/cards/wildcard-card/wildcard-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWildcards } from '@/lib/api/wildcards';
import type { WildcardWithStats } from '@/types/entities/wildcard';

const WildcardsContentView = () => {
	const { data, isLoading, error } = useWildcards({
		limit: 48,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const items: WildcardWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		// Asumiendo que el API ya devuelve datos con el formato correcto
		return list as WildcardWithStats[];
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
				<h2 className="mb-4 font-bold text-xl">Wildcards</h2>
				{items.length === 0 ? (
					<EmptyState description="You have not created any wildcards yet." icon={SparklesIcon} title="Sin wildcards" />
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{items.map((wildcard, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={wildcard.id}
								transition={{ delay: index * 0.02 }}
							>
								<WildcardCard wildcard={wildcard} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(WildcardsContentView);
