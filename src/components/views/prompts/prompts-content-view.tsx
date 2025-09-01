import { ZapIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { PromptCard } from '@/components/cards/prompt-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrompts } from '@/lib/api/prompts';
import type { PromptWithStats } from '@/types/entities/prompt';

const PromptsContentView = () => {
	const { data, isLoading, error } = usePrompts({
		limit: 48,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const items: PromptWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		// Asumiendo que el API ya devuelve datos con el formato correcto
		return list as PromptWithStats[];
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
				<h2 className="mb-4 font-bold text-xl">Prompts</h2>
				{items.length === 0 ? (
					<EmptyState description="Aún no has creado prompts." icon={ZapIcon} title="Sin prompts" />
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{items.map((prompt, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={prompt.id}
								transition={{ delay: index * 0.02 }}
							>
								<PromptCard prompt={prompt} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(PromptsContentView);
