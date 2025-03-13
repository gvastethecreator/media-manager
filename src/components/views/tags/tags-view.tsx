'use client';

import { getTags } from '@/app/actions/tags/tag.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { TagCard } from '@/components/features/entity-cards/layouts/tag-card-layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import { TagIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('TagsView');

// Definir los tipos de etiquetas permitidos
type TagType = 'normal' | 'trap' | 'spell' | 'effect' | 'ritual';

// Extender el tipo Tag para incluir campos adicionales
interface TagWithDetails {
	id: string;
	name: string;
	description?: string | null;
	type?: string | null;
	category?: string | null;
	color?: string | null;
	_count?: { images: number };
	count?: number;
	recentImages?: string[];
	createdAt: Date;
	updatedAt: Date;
}

// Función para determinar el tipo de etiqueta basado en categoría o alguna propiedad
const getTagType = (category?: string | null): TagType => {
	if (!category) {
		return 'normal';
	}

	// Mapeo simple de categorías a tipos
	switch (category.toLowerCase()) {
		case 'trap':
		case 'trampa': {
			return 'trap';
		}
		case 'spell':
		case 'hechizo':
		case 'magic':
		case 'magia': {
			return 'spell';
		}
		case 'effect':
		case 'efecto': {
			return 'effect';
		}
		case 'ritual': {
			return 'ritual';
		}
		default: {
			return 'normal';
		}
	}
};

export function TagsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();
	const [tags, setTags] = useState<TagWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticTags, _addEvent] = clientEvents.useEvents<TagWithDetails[]>(tags);

	const loadTags = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando etiquetas...');
			const data = await getTags();
			const transformedData = data.map((tagData) => {
				// Filtrar valores nulos en recentImages
				const recentImages = tagData.recentImages
					? tagData.recentImages.filter((img): img is string => img !== null)
					: [];

				return {
					...tagData,
					recentImages,
					_count: tagData._count || { images: tagData.count || 0 },
					// Usar la función para determinar el tipo de etiqueta
					type: getTagType(tagData.category),
					createdAt: new Date(tagData.createdAt),
					updatedAt: new Date(tagData.updatedAt),
				} as TagWithDetails;
			});

			setTags(transformedData);
			viewLogger.info(`✅ ${data.length} etiquetas cargadas`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando etiquetas:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTags();
	}, [loadTags]);

	const handleTagClick = useCallback(
		(tag: TagWithDetails) => {
			viewLogger.info('🖱️ Click en etiqueta:', tag.name);
			setCurrentView('tag-content');
			setCurrentTag(tag.id);
			// Actualizar la información completa de la etiqueta en el store
			useFileManager.setState({
				currentTag: {
					id: tag.id,
					name: tag.name,
					description: tag.description,
					type: tag.type,
					category: tag.category,
					color: tag.color,
					_count: tag._count,
					createdAt: tag.createdAt,
					updatedAt: tag.updatedAt,
				},
			});
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
				title="No hay etiquetas creadas"
				description="Crea etiquetas para categorizar y filtrar tus imágenes."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{optimisticTags.map((tag, index) => (
						<motion.div
							key={tag.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
						>
							<TagCard
								data={tag}
								onClick={() => handleTagClick(tag)}
								options={{
									useImageGrid: true,
									imageGridLayout: 'quad',
									imageGridGap: 4,
									imageGridStyle: 'standard',
									enableGlow: true,
									enableBorderEffect: true,
								}}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
