'use client';

import { deleteTagAction as deleteTag, searchTagsAction as searchTags } from '@/app/actions/tags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import toastService from '@/services/toast';
import type { TagWithStats } from '@/types/entities/tag';
import { TagCategory } from '@/types/entities/tag';
import { Filter, Loader2, PlusCircle, TagIcon, Trash } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { CreateTagForm } from './create-tag-form';

interface TagsSettingsProps {
	className?: string;
}

export function TagsSettings({ className }: TagsSettingsProps) {
	const [tags, setTags] = useState<TagWithStats[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<TagCategory | null>(null);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

	const formId = useId();

	// 📊 Estadísticas calculadas
	const stats = {
		total: tags.length,
		favorites: tags.filter(tag => tag.isFavorite).length,
		byCategory: Object.values(TagCategory).reduce((acc, category) => {
			acc[category] = tags.filter(tag => tag.category === category).length;
			return acc;
		}, {} as Record<TagCategory, number>),
	};

	// 🔄 Cargar tags
	const loadTags = useCallback(async () => {
		try {
			setLoading(true);
			const result = await searchTags('', {
				limit: 1000,
				includeStats: true,
			});
			setTags(result);
		} catch (error) {
			console.error('Error loading tags:', error);
			toastService.system.error('Error al cargar etiquetas');
		} finally {
			setLoading(false);
		}
	}, []);

	// 🔍 Filtrar tags
	const filteredTags = tags.filter(tag => {
		const matchesSearch = !searchTerm ||
			tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			tag.description?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesCategory = !selectedCategory || tag.category === selectedCategory;
		const matchesFavorites = !showOnlyFavorites || tag.isFavorite;

		return matchesSearch && matchesCategory && matchesFavorites;
	});

	// 🗑️ Eliminar tag
	const handleDeleteTag = async (tagId: string) => {
		try {
			setDeletingTagId(tagId);
			await deleteTag(tagId);
			setTags(prev => prev.filter(tag => tag.id !== tagId));
			toastService.system.success('Etiqueta eliminada correctamente');
		} catch (error) {
			console.error('Error deleting tag:', error);
			toastService.system.error('Error al eliminar etiqueta');
		} finally {
			setDeletingTagId(null);
		}
	};

	// 📝 Manejar creación de tag
	const handleTagCreated = (newTag: TagWithStats) => {
		setTags(prev => [...prev, newTag]);
		setShowCreateForm(false);
		toastService.system.success('Etiqueta creada correctamente');
	};

	// 🔄 Cargar tags al montar
	useEffect(() => {
		loadTags();
	}, [loadTags]);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
				<span className="ml-2">Cargando etiquetas...</span>
			</div>
		);
	}

	return (
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
							{tags.length > 0 ?
								tags.reduce((max, tag) =>
									(tag.stats?.totalAssociations || 0) > (max.stats?.totalAssociations || 0) ? tag : max
								).name : 'N/A'
							}
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
						<PopoverTrigger asChild>
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
										<Label htmlFor="all-categories" className="text-sm">Todas</Label>
									</div>
									{Object.values(TagCategory).map(category => (
										<div key={category} className="flex items-center space-x-2">
											<Checkbox
												id={`category-${category}`}
												checked={selectedCategory === category}
												onCheckedChange={() => setSelectedCategory(
													selectedCategory === category ? null : category
												)}
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
							onCheckedChange={setShowOnlyFavorites}
						/>
						<Label htmlFor="favorites-only" className="text-sm">Solo favoritas</Label>
					</div>

					{/* Botón crear */}
					<Button onClick={() => setShowCreateForm(true)} size="sm">
						<PlusCircle className="h-4 w-4 mr-2" />
						Nueva etiqueta
					</Button>
				</div>
			</div>

			{/* 📋 Lista de etiquetas */}
			{filteredTags.length === 0 ? (
				<EmptyState
					icon={TagIcon}
					title="No hay etiquetas"
					description={
						searchTerm || selectedCategory || showOnlyFavorites
							? "No se encontraron etiquetas que coincidan con los filtros aplicados."
							: "Aún no has creado ninguna etiqueta. ¡Crea tu primera etiqueta!"
					}
					action={
						<Button onClick={() => setShowCreateForm(true)}>
							<PlusCircle className="h-4 w-4 mr-2" />
							Crear primera etiqueta
						</Button>
					}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredTags.map(tag => (
						<Card key={tag.id} className="hover:shadow-md transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<span className="text-lg">{tag.emoji}</span>
										<div>
											<CardTitle className="text-sm font-medium">{tag.name}</CardTitle>
											{tag.description && (
												<CardDescription className="text-xs mt-1">
													{tag.description}
												</CardDescription>
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
											disabled={deletingTagId === tag.id}
											className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
										>
											{deletingTagId === tag.id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<div className="flex items-center gap-4">
										<span>Asociaciones: {tag.stats?.totalAssociations || 0}</span>
										{tag.category && (
											<Badge variant="outline" className="text-xs">
												{tag.category}
											</Badge>
										)}
									</div>
									<div
										className="w-4 h-4 rounded-full border"
										style={{ backgroundColor: tag.color }}
									/>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* 📝 Formulario de creación */}
			{showCreateForm && (
				<CreateTagForm
					onSuccess={handleTagCreated}
					onCancel={() => setShowCreateForm(false)}
				/>
			)}
		</div>
	);
}

// Función auxiliar para generar colores basados en categoría
function _generateCategoryColor(category: TagCategory): string {
	switch (category) {
		case TagCategory.CHARACTER:
			return 'bg-blue-500';
		case TagCategory.LOCATION:
			return 'bg-green-500';
		case TagCategory.OBJECT:
			return 'bg-yellow-500';
		case TagCategory.CONCEPT:
			return 'bg-purple-500';
		case TagCategory.EVENT:
			return 'bg-red-500';
		case TagCategory.COLOR:
			return 'bg-indigo-500';
		case TagCategory.STYLE:
			return 'bg-pink-500';
		case TagCategory.EMOTION:
			return 'bg-orange-500';
		case TagCategory.CUSTOM:
			return 'bg-cyan-500';
		default:
			return 'bg-gray-500';
	}
}
