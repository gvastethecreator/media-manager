'use client';

import { TagCard, type TagWithStats } from '@/components/cards/tag-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTags } from '@/lib/api/tags';
import { clientLogger } from '@/lib/logger/client-logger';
import { useTagStore } from '@/store/entities/tag';
import { Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('TagsView');

// Crear un componente de tarjeta memorizada para optimizar
const MemoizedTagCard = memo(
	({ tag, onClick }: { tag: TagWithStats; onClick: () => void }) => <TagCard tag={tag} onClick={onClick} />,
	(prevProps, nextProps) => {
		// Solo re-renderizar si cambian estos valores
		return (
			prevProps.tag.id === nextProps.tag.id &&
			prevProps.tag.updatedAt.getTime() === nextProps.tag.updatedAt.getTime() &&
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
	const { selectedId, setSelectedId } = useTagStore((state) => ({
		selectedId: state.selectedId,
		setSelectedId: (id: string) => state.setSelectedId(id),
	}));

	const { data: tagsResponse, isLoading, error } = useTags();
	const tags = tagsResponse?.data || [];

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

			// Actualizar el estado de selección en el store de etiquetas
			setSelectedId(tag.id);

			// Luego cambiar la vista para mostrar el contenido
			setCurrentView('tag-content');
		},
		[setCurrentView, setSelectedId]
	);

	// Renderizar estados de carga y error
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
							{tag.id && <MemoizedTagCard tag={tag} onClick={() => handleTagClick(tag)} />}
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
