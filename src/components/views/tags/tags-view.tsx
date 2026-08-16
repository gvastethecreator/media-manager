import { Tag } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { TagCard } from '@/components/cards/tag-card/tag-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
				clientLogger.error('❌ Error: Attempted to select an invalid tag', tag);
				return;
			}

			// Comprobar que la etiqueta tiene todos los datos necesarios
			if (!tag.name) {
				clientLogger.warn('⚠️ Warning: The tag does not have a name');
			}

			viewLogger.info('🔍 Selecting tag:', { tagId: tag.id, tagName: tag.name });

			// Actualizar el estado de selección en el store de etiquetas
			selectTag(tag.id);

			// Luego cambiar la vista para mostrar el contenido
			navigateWithTransition('/tag-content');
		},
		[navigateWithTransition, selectTag]
	);

	const handleCreateTag = useCallback(() => {
		if (newTagName.trim() === '') {
			clientLogger.error('❌ Error: Tag name cannot be empty');
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
				<h2 className="mb-4 font-bold text-xl">Tags</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancel' : 'Create Tag'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">New Tag</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="tagName">Name</Label>
							<Input
								id="tagName"
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder="Tag name"
								value={newTagName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="tagDescription">Description</Label>
							<Textarea
								id="tagDescription"
								onChange={(e) => setNewTagDescription(e.target.value)}
								placeholder="Tag description (optional)"
								value={newTagDescription}
							/>
						</div>
						<Button onClick={handleCreateTag}>Save Tag</Button>
					</div>
				)}

				{!tags || (tags.length === 0 && !isLoading && !showForm) ? (
					<EmptyState
						description="Create tags to organize your images by topic or characteristic."
						icon={Tag}
						title="No tags yet"
					/>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
