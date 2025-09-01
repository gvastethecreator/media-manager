import { TagIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { TagCard } from '@/components/cards/tag-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTags } from '@/lib/api/tags';
import { toTagWithStats } from '@/transformers/tag';
import type { TagWithStats } from '@/types/entities/tag';

const TagsContentView = () => {
	const { data, isLoading, error } = useTags({
		limit: 48,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const items: TagWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		return list.map(toTagWithStats);
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
				<h2 className="mb-4 font-bold text-xl">Etiquetas</h2>
				{items.length === 0 ? (
					<EmptyState description="Aún no has creado etiquetas." icon={TagIcon} title="Sin etiquetas" />
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{items.map((tag, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={tag.id}
								transition={{ delay: index * 0.02 }}
							>
								<TagCard tag={tag} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(TagsContentView);
