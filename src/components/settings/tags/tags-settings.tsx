'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteTag, useTags } from '@/lib/api/tags';
import toastService from '@/services/toast';
import { TagCategory } from '@/types/entities/tag';
import type { TagBase as UITag } from '@/types/entities/tag/types';
import { Filter, Loader2, PlusCircle, TagIcon, Trash } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { CreateTagForm } from './create-tag-form';

interface TagsSettingsProps {
	className?: string;
}

export function TagsSettings({ className }: TagsSettingsProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<TagCategory | null>(null);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);

	const formId = useId();

	// React Query hooks
	const { data: tagsResponse, isLoading, error } = useTags({
		search: searchTerm,
		limit: 1000
	});
	const deleteTagMutation = useDeleteTag();

	const tags = tagsResponse?.data || [];

	// 📊 Estadísticas calculadas
	const stats = useMemo(() => ({
		total: tags.length,
		favorites: tags.filter((tag) => tag.isFavorite).length,
		byCategory: Object.values(TagCategory).reduce(
			(acc, category) => {
				acc[category] = tags.filter((tag) => tag.category === category).length;
				return acc;
			},
			{} as Record<TagCategory, number>
		),
	}), [tags]);

	// 🔍 Filtrar tags
	const filteredTags = useMemo(() => {
		return tags.filter((tag) => {
			const matchesCategory = !selectedCategory || tag.category === selectedCategory;
			const matchesFavorites = !showOnlyFavorites || tag.isFavorite;

			return matchesCategory && matchesFavorites;
		});
	}, [tags, selectedCategory, showOnlyFavorites]);

	// 🗑️ Eliminar tag
	const handleDeleteTag = useCallback(async (tagId: string) => {
		try {
			await deleteTagMutation.mutateAsync(tagId);
			toastService.success('Etiqueta eliminada correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error('Error al eliminar etiqueta', {
				description: errorMessage,
			});
		}
	}, [deleteTagMutation]);

	// 📝 Manejar creación de tag
	const handleTagCreated = useCallback((newTag: UITag) => {
		setShowCreateForm(false);
		toastService.success('Etiqueta creada correctamente');
	}, []);

	// Estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-8">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<span className="text-sm text-muted-foreground">Cargando etiquetas...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Estado de error
	if (error) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-8">
						<p className="text-sm text-destructive">Error al cargar etiquetas: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<div className={className}>
				{/* 📊 Estadísticas */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Total de Etiquetas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Favoritas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.favorites}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Más Usada</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-sm">
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
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Input
							placeholder="Buscar etiquetas..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full"
						/>
					</div>

					<div className="flex gap-2">
						{/* Filtro por categoría */}
						<Popover>
							<PopoverTrigger>
								<Button variant="outline" size="sm">
									<Filter className="h-4 w-4 mr-2" />
									{selectedCategory || 'Todas las categorías'}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-56">
								<div className="space-y-2">
									<Label className="text-sm font-medium">Filtrar por categoría</Label>
									<div className="space-y-1">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="all-categories"
												checked={!selectedCategory}
												onCheckedChange={() => setSelectedCategory(null)}
											/>
											<Label htmlFor="all-categories" className="text-sm">
												Todas
											</Label>
										</div>
										{Object.values(TagCategory).map((category) => (
											<div key={category} className="flex items-center space-x-2">
												<Checkbox
													id={`category-${category}`}
													checked={selectedCategory === category}
													onCheckedChange={() => setSelectedCategory(selectedCategory === category ? null : category)}
												/>
												<Label htmlFor={`category-${category}`} className="text-sm">
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
								id="favorites-only"
								checked={showOnlyFavorites}
								onCheckedChange={(checked) => setShowOnlyFavorites(checked === true)}
							/>
							<Label htmlFor="favorites-only" className="text-sm">
								Solo favoritas
							</Label>
						</div>

						{/* Botón crear */}
						<Button onClick={() => setShowCreateForm(true)} size="sm">
							<PlusCircle className="h-4 w-4 mr-2" />
							Nueva etiqueta
						</Button>
					</div>
				</div>

				{/* 📋 Lista de etiquetas con scroll compacto */}
				{filteredTags.length === 0 ? (
					<EmptyState
						icon={TagIcon}
						title="No hay etiquetas"
						description={
							searchTerm || selectedCategory || showOnlyFavorites
								? 'No se encontraron etiquetas que coincidan con los filtros aplicados.'
								: 'Aún no has creado ninguna etiqueta. ¡Crea tu primera etiqueta!'
						}
						actions={
							<Button onClick={() => setShowCreateForm(true)}>
								<PlusCircle className="h-4 w-4 mr-2" />
								Crear primera etiqueta
							</Button>
						}
					/>
				) : (
					<div
						className="max-h-[600px] overflow-y-auto pr-2 space-y-4"
						style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(203 213 225) transparent' }}
					>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredTags.map((tag) => (
								<Card key={tag.id} className="hover:shadow-md transition-shadow">
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-2">
												<span className="text-lg">{tag.emoji}</span>
												<div>
													<CardTitle className="text-sm font-medium">{tag.name}</CardTitle>
													{tag.description && (
														<CardDescription className="text-xs mt-1">{tag.description}</CardDescription>
													)}
												</div>
											</div>
											<div className="flex items-center gap-1">
												{tag.isFavorite && (
													<Badge variant="secondary" className="text-xs">
														Favorita
													</Badge>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeleteTag(tag.id)}
													className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
												>
													<Trash className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<div className="flex items-center gap-4">
												<span>Relaciones: {tag.stats?.totalRelations || 0}</span>
												{tag.category && (
													<Badge variant="outline" className="text-xs">
														{tag.category}
													</Badge>
												)}
											</div>
											<div className="w-4 h-4 rounded-full border" style={{ backgroundColor: tag.color }} />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* 📝 Formulario de creación */}
				{showCreateForm && <CreateTagForm onCreated={handleTagCreated} onCancel={() => setShowCreateForm(false)} />}
			</div>
		</ScrollArea>
	);
}

// Función auxiliar para generar colores basados en categoría
function _generateCategoryColor(category: TagCategory): string {
	switch (category) {
		case TagCategory.GENERAL:
			return 'bg-gray-500';
		case TagCategory.SUBJECT:
			return 'bg-blue-500';
		case TagCategory.STYLE:
			return 'bg-purple-500';
		case TagCategory.COLOR:
			return 'bg-indigo-500';
		case TagCategory.QUALITY:
			return 'bg-green-500';
		case TagCategory.TECHNIQUE:
			return 'bg-yellow-500';
		case TagCategory.COMPOSITION:
			return 'bg-red-500';
		case TagCategory.CONTENT:
			return 'bg-pink-500';
		case TagCategory.EMOTION:
			return 'bg-orange-500';
		case TagCategory.THEME:
			return 'bg-cyan-500';
		case TagCategory.GENRE:
			return 'bg-teal-500';
		case TagCategory.CUSTOM:
			return 'bg-violet-500';
		case TagCategory.OTHER:
		default:
			return 'bg-gray-500';
	}
}
