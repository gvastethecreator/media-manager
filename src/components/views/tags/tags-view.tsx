import { Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useState } from 'react';
import { TagCard } from '@/components/cards/tag-card/tag-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTag, useTags } from '@/lib/api/tags';
import { clientLogger } from '@/lib/logger/client-logger';
import { useTagStore } from '@/store/entities/tag';
import type { TagWithStats } from '@/types/entities/tag';

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
export function TagsView() {
	const { setCurrentView } = useNavigationStore();
	const selectTag = useTagStore((state) => state.selectTag);

	const { data: tagsResponse, isLoading, error } = useTags();
	const { mutate: createTag } = useCreateTag();

	const [showForm, setShowForm] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [newTagDescription, setNewTagDescription] = useState('');

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

			viewLogger.info('🔍 Seleccionando etiqueta:', { tagId: tag.id, tagName: tag.name });

			// Actualizar el estado de selección en el store de etiquetas
			selectTag(tag.id);

			// Luego cambiar la vista para mostrar el contenido
			setCurrentView('tag-content');
		},
		[setCurrentView, selectTag]
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
			<div className="flex items-center justify-center h-full">
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
				<h2 className="text-xl font-bold mb-4">Vista de Etiquetas</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Etiqueta'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nueva Etiqueta</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="tagName">Nombre</Label>
							<Input
								id="tagName"
								value={newTagName}
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder="Nombre de la etiqueta"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="tagDescription">Descripción</Label>
							<Textarea
								id="tagDescription"
								value={newTagDescription}
								onChange={(e) => setNewTagDescription(e.target.value)}
								placeholder="Descripción de la etiqueta (opcional)"
							/>
						</div>
						<Button onClick={handleCreateTag}>Guardar Etiqueta</Button>
					</div>
				)}

				{!tags || (tags.length === 0 && !isLoading && !showForm) ? (
					<EmptyState
						icon={Tag}
						title="No hay etiquetas creadas"
						description="Crea etiquetas para organizar tus imágenes por temas o características."
					/>
				) : (
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
				)}
			</div>
		</ScrollArea>
	);
}
