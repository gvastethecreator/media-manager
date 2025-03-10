'use client';

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { TagCard } from '@/components/features/entity-cards/cards/tag-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger';
import { useTagsStore } from '@/store/entities/tags.store';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import { TagIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useCallback, useEffect } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('TagsView');

export function TagsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();
	const { tags, isLoading, error, loadTags } = useTagsStore();

	// Usar el nuevo hook de eventos optimistas
	const [optimisticTags] = clientEvents.useEvents(tags);

	const fetchTags = useCallback(async () => {
		try {
			viewLogger.info('🔄 Cargando etiquetas...');
			await loadTags();
			viewLogger.info(`✅ ${tags.length} etiquetas cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error al cargar etiquetas:', error);
		}
	}, [loadTags, tags.length]);

	useEffect(() => {
		fetchTags();
	}, [fetchTags]);

	const handleTagClick = useCallback(
		(tagId: string) => {
			viewLogger.info('🔍 Ver etiqueta:', tagId);
			setCurrentView('tag-content');
			setCurrentTag(tagId);
		},
		[setCurrentView, setCurrentTag]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticTags || optimisticTags.length === 0) {
		return (
			<EmptyState
				icon={TagIcon}
				title="No hay etiquetas"
				description="Las etiquetas te ayudan a organizar y encontrar tus imágenes. Crea una nueva etiqueta desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{optimisticTags.map((tag) => (
						<button
							key={tag.id}
							type="button"
							className="cursor-pointer text-left w-full"
							onClick={() => handleTagClick(tag.id)}
							aria-label={`Ver etiqueta ${tag.name}`}
						>
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
								<TagCard tag={tag} />
							</motion.div>
						</button>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
