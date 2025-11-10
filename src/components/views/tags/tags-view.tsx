import { Tag } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { TagCard } from '@/components/cards/tag-card/tag-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useEntitySelection } from '@/hooks/use-entity-selection';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { useCreateTag, useTags } from '@/lib/api/tags';
import { clientLogger } from '@/lib/logger/client-logger';
import { useTagStore } from '@/store/entities/tag';
import type { TagWithStats } from '@/types/entities/tag';

const viewLogger = clientLogger.withContext('TagsView');

// Crear un componente de tarjeta memorizada para optimizar
const MemoizedTagCard = memo(
	({ tag, onClick }: { tag: TagWithStats; onClick: () => void }) => <TagCard onClick={onClick} tag={tag} />,
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
export function TagsView() {
	const { navigateWithTransition } = useSeamlessNavigation();
	const selectTag = useTagStore((state) => state.selectTag);
	const { handleItemClick: updateSelection } = useEntitySelection();

	const { data: tagsResponse, isLoading, error } = useTags();
	const { mutate: createTag } = useCreateTag();

	const [showForm, setShowForm] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [newTagDescription, setNewTagDescription] = useState('');

	const tags = tagsResponse?.data || [];

	// Manejar el clic en una etiqueta
	const handleTagClick = useCallback(
		(tag: TagWithStats) => {
			if (!tag?.id) {
				console.error('❌ Error: Intento de seleccionar una etiqueta inválida', tag);
				return;
			}

			// Comprobar que la etiqueta tiene todos los datos necesarios
			if (!tag.name) {
				console.warn('⚠️ Advertencia: La etiqueta no tiene un nombre definido');
			}

			viewLogger.info('🔍 Seleccionando etiqueta:', { tagId: tag.id, tagName: tag.name });

			// Actualizar el estado de selección en el store de etiquetas
			selectTag(tag.id);

			// Actualizar panel de detalles con la etiqueta seleccionada
			updateSelection(tag as any);

			// Luego cambiar la vista para mostrar el contenido
			navigateWithTransition('/tag-content');
		},
		[navigateWithTransition, selectTag, updateSelection]
	);

	const handleCreateTag = useCallback(() => {
		if (newTagName.trim() === '') {
			console.error('❌ Error: El nombre de la etiqueta no puede estar vacío');
			return;
		}
		createTag({ name: newTagName, description: newTagDescription });
		setNewTagName('');
		setNewTagDescription('');
		setShowForm(false);
	}, [newTagName, newTagDescription, createTag]);

	// Renderizar estados de carga y error
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
				<h2 className="mb-4 font-bold text-xl">Vista de Etiquetas</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Etiqueta'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nueva Etiqueta</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="tagName">Nombre</Label>
							<Input
								id="tagName"
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder="Nombre de la etiqueta"
								value={newTagName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="tagDescription">Descripción</Label>
							<Textarea
								id="tagDescription"
								onChange={(e) => setNewTagDescription(e.target.value)}
								placeholder="Descripción de la etiqueta (opcional)"
								value={newTagDescription}
							/>
						</div>
						<Button onClick={handleCreateTag}>Guardar Etiqueta</Button>
					</div>
				)}

				{!tags || (tags.length === 0 && !isLoading && !showForm) ? (
					<EmptyState
						description="Crea etiquetas para organizar tus imágenes por temas o características."
						icon={Tag}
						title="No hay etiquetas creadas"
					/>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{tags.map((tag, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={tag.id}
								transition={{ delay: index * 0.05 }}
							>
								{tag.id && <MemoizedTagCard onClick={() => handleTagClick(tag)} tag={tag} />}
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
