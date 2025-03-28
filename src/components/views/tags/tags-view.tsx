'use client';

import { getTags, type TagWithStats } from '@/app/actions/tags/tag.actions';
import { TagCard } from '@/components/cards/tag-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('TagsView');

// Crear un componente de tarjeta memorizada para optimizar
const MemoizedTagCard = memo(
	({ tag, onClick }: { tag: TagWithStats; onClick: () => void }) => (
		<TagCard tag={tag} onClick={onClick} />
	),
	(prevProps, nextProps) => {
		// Solo re-renderizar si cambian estos valores
		return (
			prevProps.tag.id === nextProps.tag.id &&
			prevProps.tag.updatedAt === nextProps.tag.updatedAt &&
			prevProps.tag._count?.images === nextProps.tag._count?.images
		);
	}
);
MemoizedTagCard.displayName = 'MemoizedTagCard';

/**
 * 🏷️ Vista de etiquetas
 *
 * Muestra todas las etiquetas disponibles en el sistema utilizando el componente TagCard
 */
export function TagsView({ className }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();
	const [tags, setTags] = useState<TagWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar etiquetas al montar el componente
	useEffect(() => {
		async function loadTags() {
			try {
				setIsLoading(true);
				viewLogger.info('🔄 Cargando etiquetas...');
				const fetchedTags = await getTags();

				// Transformar los datos para adaptarlos al formato esperado
				const transformedTags = fetchedTags.map((tagData) => {
					return {
						...tagData,
						createdAt: tagData.createdAt instanceof Date ? tagData.createdAt : new Date(tagData.createdAt),
						updatedAt: tagData.updatedAt instanceof Date ? tagData.updatedAt : new Date(tagData.updatedAt),
						lastUpdated: tagData.lastUpdated instanceof Date ? tagData.lastUpdated : new Date(tagData.lastUpdated),
					};
				});

				setTags(transformedTags);
				viewLogger.info(`✅ ${transformedTags.length} etiquetas cargadas`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				viewLogger.error('❌ Error cargando etiquetas:', error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		}

		loadTags();
	}, []);

	// Manejar el clic en una etiqueta
	const handleTagClick = useCallback(
		(tag: TagWithStats) => {
			if (!tag || !tag.id) {
				console.error('❌ Error: Intento de seleccionar una etiqueta inválida', tag);
				return;
			}

			// Comprobar que la etiqueta tiene todos los datos necesarios
			if (!tag.name) {
				console.warn('⚠️ Advertencia: La etiqueta no tiene un nombre definido');
			}

			viewLogger.info('🔍 Seleccionando etiqueta:', tag.id, tag.name);

			// Primero actualizar el estado con la información completa
			useFileManager.setState({
				currentTag: {
					id: tag.id,
					name: tag.name || 'Sin nombre',
					color: tag.color || '#cccccc',
					count: tag._count?.images || 0,
				},
			});

			// Luego cambiar la vista y cargar el contenido
			setCurrentView('tag-content');
			setCurrentTag(tag.id);
		},
		[setCurrentView, setCurrentTag]
	);

	// Renderizar estados de carga y error
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

	if (!tags || tags.length === 0) {
		return (
			<EmptyState
				icon={Tag}
				title="No hay etiquetas creadas"
				description="Crea etiquetas para organizar tus imágenes por temas o características."
			/>
		);
	}

	// Renderizar la lista de etiquetas en tarjetas
	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{tags.map((tag, index) => (
						<motion.div
							key={tag.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
						>
							{tag.id && (
								<MemoizedTagCard
									tag={tag}
									onClick={() => handleTagClick(tag)}
								/>
							)}
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
