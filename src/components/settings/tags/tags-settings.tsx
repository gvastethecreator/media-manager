import { Edit2, Filter, Loader2, PlusCircle, TagIcon, Trash } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox-v3';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteTag, useTags } from '@/lib/api/tags';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { TagBase as UITag } from '@/types/entities/tag';
import { TagCategory } from '@/types/entities/tag';
import { CreateTagForm } from './create-tag-form';

interface TagsSettingsProps {
	className?: string;
}

export function TagsSettings({ className }: TagsSettingsProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<TagCategory | null>(null);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingTag, setEditingTag] = useState<UITag | null>(null);

	const formId = useId();

	// React Query hooks
	const {
		data: tagsResponse,
		isLoading,
		error,
	} = useTags({
		search: searchTerm,
		limit: 1000,
	});
	const deleteTagMutation = useDeleteTag();

	const tags = tagsResponse?.data || [];

	// 📊 Estadísticas calculadas
	const stats = useMemo(
		() => ({
			total: tags.length,
			favorites: tags.filter((tag) => tag.isFavorite).length,
			byCategory: Object.values(TagCategory).reduce(
				(acc, category) => {
					acc[category] = tags.filter((tag) => tag.category === category).length;
					return acc;
				},
				{} as Record<TagCategory, number>
			),
		}),
		[tags]
	);

	// 🔍 Filtrar tags
	const filteredTags = useMemo(() => {
		return tags.filter((tag) => {
			const matchesCategory = !selectedCategory || tag.category === selectedCategory;
			const matchesFavorites = !showOnlyFavorites || tag.isFavorite;

			return matchesCategory && matchesFavorites;
		});
	}, [tags, selectedCategory, showOnlyFavorites]);

	// 🗑️ Eliminar tag
	const handleDeleteTag = useCallback(
		async (tagId: string) => {
			try {
				await deleteTagMutation.mutateAsync(tagId);
				toastService.success('Etiqueta eliminada correctamente');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar etiqueta', {
					description: errorMessage,
				});
			}
		},
		[deleteTagMutation]
	);

	// 📝 Manejar creación de tag
	const handleTagCreated = useCallback((_newTag: UITag) => {
		setShowCreateForm(false);
		toastService.success('Etiqueta creada correctamente');
	}, []);

	const handleTagUpdated = useCallback((_updated: UITag) => {
		setEditingTag(null);
		toastService.success('Etiqueta actualizada correctamente');
	}, []);

	// Estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-4">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<span className="text-body-sm text-muted-foreground">Cargando etiquetas...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Estado de error
	if (error) {
		return (
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-4">
						<p className="text-body-sm text-destructive">Error al cargar etiquetas: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<div className={className}>
				{/* 📊 Estadísticas */}
				<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
					<Card className="rounded-dt-sm border-border/30 bg-muted/20 shadow-sm">
						<CardHeader className="space-y-0 pb-2">
							<CardTitle className="text-caption text-muted-foreground">Total de Etiquetas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-numeric-lg">{stats.total}</div>
						</CardContent>
					</Card>
					<Card className="rounded-dt-sm border-border/30 bg-muted/20 shadow-sm">
						<CardHeader className="space-y-0 pb-2">
							<CardTitle className="text-caption text-muted-foreground">Favoritas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-numeric-lg">{stats.favorites}</div>
						</CardContent>
					</Card>
					<Card className="rounded-dt-sm border-border/30 bg-muted/20 shadow-sm">
						<CardHeader className="space-y-0 pb-2">
							<CardTitle className="text-caption text-muted-foreground">Más Usada</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-body-sm">
								{tags.length > 0
									? tags.reduce((max, tag) =>
											(tag.stats?.totalRelations || 0) > (max.stats?.totalRelations || 0) ? tag : max
										).name
									: 'N/A'}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* 🔍 Controles */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row">
					<div className="flex-1">
						<Input
							className="w-full"
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Buscar etiquetas..."
							value={searchTerm}
						/>
					</div>

					<div className="flex gap-2">
						{/* Filtro por categoría */}
						<Popover>
							<PopoverTrigger>
								<Button size="sm" variant="outline">
									<Filter className="mr-2 h-4 w-4" />
									{selectedCategory || 'Todas las categorías'}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-56">
								<div className="space-y-stack-sm">
									<Label className="font-medium text-body-sm">Filtrar por categoría</Label>
									<div className="space-y-1">
										<div className="flex items-center space-x-2">
											<Checkbox
												checked={!selectedCategory}
												id="all-categories"
												onCheckedChange={() => setSelectedCategory(null)}
											/>
											<Label className="text-body-sm" htmlFor="all-categories">
												Todas
											</Label>
										</div>
										{Object.values(TagCategory).map((category) => (
											<div className="flex items-center space-x-2" key={category}>
												<Checkbox
													checked={selectedCategory === category}
													id={`category-${category}`}
													onCheckedChange={() => setSelectedCategory(selectedCategory === category ? null : category)}
												/>
												<Label className="text-body-sm" htmlFor={`category-${category}`}>
													{category} ({stats.byCategory[category] || 0})
												</Label>
											</div>
										))}
									</div>
								</div>
							</PopoverContent>
						</Popover>

						{/* Filtro por favoritas */}
						<div className="flex items-center space-x-2">
							<Checkbox
								checked={showOnlyFavorites}
								id="favorites-only"
								onCheckedChange={(checked) => setShowOnlyFavorites(checked === true)}
							/>
							<Label className="text-body-sm" htmlFor="favorites-only">
								Solo favoritas
							</Label>
						</div>

						{/* Botón crear */}
						<Button onClick={() => setShowCreateForm(true)} size="sm">
							<PlusCircle className="mr-2 h-4 w-4" />
							Nueva etiqueta
						</Button>
					</div>
				</div>

				{/* 📋 Lista de etiquetas con scroll compacto */}
				{filteredTags.length === 0 ? (
					<EmptyState
						actions={
							<Button onClick={() => setShowCreateForm(true)}>
								<PlusCircle className="mr-2 h-4 w-4" />
								Crear primera etiqueta
							</Button>
						}
						description={
							searchTerm || selectedCategory || showOnlyFavorites
								? 'No se encontraron etiquetas que coincidan con los filtros aplicados.'
								: 'Aún no has creado ninguna etiqueta. ¡Crea tu primera etiqueta!'
						}
						icon={TagIcon}
						title="No hay etiquetas"
					/>
				) : (
					<div
						className="max-h-150 space-y-4 overflow-y-auto pr-2"
						style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
					>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredTags.map((tag) => (
								<Card
									className="rounded-dt-sm border-border/30 shadow-dt-0 transition-shadow hover:shadow-dt-1"
									key={tag.id}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-2">
												<span className="text-lg">{tag.emoji}</span>
												<div>
													<CardTitle className="text-body-sm">{tag.name}</CardTitle>
													{tag.description && (
														<CardDescription className="mt-1 text-caption">{tag.description}</CardDescription>
													)}
												</div>
											</div>
											<div className="flex items-center gap-1">
												{tag.isFavorite && (
													<Badge className="text-caption" variant="secondary">
														Favorita
													</Badge>
												)}
												<Button
													className="h-8 w-8 p-0 text-muted-foreground"
													onClick={() => setEditingTag(tag)}
													size="sm"
													title="Editar etiqueta"
													variant="ghost"
												>
													<Edit2 className="h-4 w-4" />
												</Button>
												<Button
													className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
													onClick={() => handleDeleteTag(tag.id)}
													size="sm"
													variant="ghost"
												>
													<Trash className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex items-center justify-between text-caption text-muted-foreground">
											<div className="flex items-center gap-4">
												<span>Relaciones: {tag.stats?.totalRelations || 0}</span>
												{tag.category && (
													<Badge className="text-caption" variant="outline">
														{tag.category}
													</Badge>
												)}
											</div>
											<div
												className="h-4 w-4 rounded-full border"
												style={{ backgroundColor: tag.color || DEFAULT_NEUTRAL_COLOR }}
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* 📝 Formulario de creación */}
				{showCreateForm && <CreateTagForm onCancel={() => setShowCreateForm(false)} onCreated={handleTagCreated} />}

				<Dialog onOpenChange={(open) => !open && setEditingTag(null)} open={Boolean(editingTag)}>
					<DialogContent className="max-w-xl p-0">
						<DialogHeader className="px-6 pt-6">
							<DialogTitle>Editar etiqueta</DialogTitle>
						</DialogHeader>
						{editingTag && (
							<div className="px-6 pb-6">
								<CreateTagForm
									isEditing
									onCancel={() => setEditingTag(null)}
									onUpdated={handleTagUpdated}
									tag={editingTag as any}
								/>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</ScrollArea>
	);
}

// Función auxiliar para generar colores basados en categoría
function _generateCategoryColor(category: TagCategory): string {
	switch (category) {
		case TagCategory.GENERAL:
			return 'bg-dt-neutral-500';
		case TagCategory.SUBJECT:
			return 'bg-dt-primary-500';
		case TagCategory.STYLE:
			return 'bg-entity-character';
		case TagCategory.COLOR:
			return 'bg-entity-file-3d';
		case TagCategory.QUALITY:
			return 'bg-dt-success-500';
		case TagCategory.TECHNIQUE:
			return 'bg-dt-warning-500';
		case TagCategory.COMPOSITION:
			return 'bg-dt-danger-500';
		case TagCategory.CONTENT:
			return 'bg-entity-tag';
		case TagCategory.EMOTION:
			return 'bg-ui-warning-text';
		case TagCategory.THEME:
			return 'bg-entity-collection';
		case TagCategory.GENRE:
			return 'bg-entity-group';
		case TagCategory.CUSTOM:
			return 'bg-entity-album';
		default:
			return 'bg-dt-neutral-500';
	}
}
