'use client';

/**
 * @file Componente de ejemplo para demonstrar la entidad Tag
 * @module app/components/examples/TagsExample
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTagStore } from '@/store/entities/tag';
import { createTag, deleteTag, updateTag } from '@/transformers/tag';
import { TagViewMode } from '@/types/entities/tag/enums';
import { TagComplete } from '@/types/entities/tag/types';
import { ServerEventManager } from '@/utils/server-events';
import { PlusCircle, RefreshCw, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function TagsExample() {
	// Estado local
	const [isLoading, setIsLoading] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [newTagEmoji, setNewTagEmoji] = useState('🏷️');

	// Estado global desde store
	const {
		items: tags,
		selectedId,
		viewMode,
		selectTag,
		setViewMode,
		loadTags,
		refreshTags
	} = useTagStore();

	// Cargar etiquetas al montar el componente
	useEffect(() => {
		loadTags();

		// Suscribirse a eventos del servidor
		const unsubscribe = ServerEventManager.subscribe({
			type: 'tags:modified',
			callback: () => {
				refreshTags();
				toast.info('Las etiquetas han sido modificadas');
			}
		});

		return () => {
			unsubscribe();
		};
	}, [loadTags, refreshTags]);

	// Manejadores de eventos
	const handleCreateTag = async () => {
		if (!newTagName.trim()) {
			toast.error('El nombre de la etiqueta es obligatorio');
			return;
		}

		setIsLoading(true);
		try {
			await createTag({
				name: newTagName,
				emoji: newTagEmoji,
			});
			setNewTagName('');
			setNewTagEmoji('🏷️');
			toast.success('Etiqueta creada correctamente');
			refreshTags();
		} catch (error) {
			toast.error('Error al crear la etiqueta');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteTag = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar esta etiqueta?')) {
			return;
		}

		setIsLoading(true);
		try {
			await deleteTag(id);
			toast.success('Etiqueta eliminada correctamente');
			refreshTags();
		} catch (error) {
			toast.error('Error al eliminar la etiqueta');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleFavorite = async (tag: TagComplete) => {
		setIsLoading(true);
		try {
			await updateTag(tag.id, {
				isFavorite: !tag.isFavorite,
			});
			toast.success(`Etiqueta ${tag.isFavorite ? 'removida de' : 'añadida a'} favoritos`);
			refreshTags();
		} catch (error) {
			toast.error('Error al actualizar la etiqueta');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TagIcon className="h-5 w-5" />
					Ejemplo de Etiquetas
				</CardTitle>
				<CardDescription>
					Demostración del uso de la entidad Tag con sus transformadores y store
				</CardDescription>
			</CardHeader>

			<CardContent>
				<Tabs defaultValue="list" className="w-full">
					<TabsList className="mb-4">
						<TabsTrigger
							value="list"
							onClick={() => setViewMode(TagViewMode.LIST)}
						>
							Lista
						</TabsTrigger>
						<TabsTrigger
							value="grid"
							onClick={() => setViewMode(TagViewMode.GRID)}
						>
							Cuadrícula
						</TabsTrigger>
						<TabsTrigger value="create">Crear</TabsTrigger>
					</TabsList>

					<TabsContent value="list" className="space-y-4">
						<div className="flex justify-between">
							<h3 className="text-sm font-medium">Etiquetas ({tags.length})</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => refreshTags()}
								disabled={isLoading}
							>
								<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
							</Button>
						</div>

						<div className="space-y-2">
							{tags.length === 0 ? (
								<div className="text-center py-4 text-muted-foreground">
									No hay etiquetas disponibles
								</div>
							) : (
								tags.map(tag => (
									<div
										key={tag.id}
										className={`flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer ${selectedId === tag.id ? 'bg-muted' : ''
											}`}
										onClick={() => selectTag(tag.id)}
									>
										<div className="flex items-center gap-2">
											<span className="text-lg">{tag.emoji}</span>
											<span className="font-medium">{tag.name}</span>
											{tag.isFavorite && <span className="text-yellow-500">★</span>}
										</div>

										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleToggleFavorite(tag);
												}}
											>
												{tag.isFavorite ? '★' : '☆'}
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteTag(tag.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))
							)}
						</div>
					</TabsContent>

					<TabsContent value="grid" className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{tags.length === 0 ? (
								<div className="text-center py-4 text-muted-foreground col-span-full">
									No hay etiquetas disponibles
								</div>
							) : (
								tags.map(tag => (
									<Card
										key={tag.id}
										className={`cursor-pointer ${selectedId === tag.id ? 'ring-2 ring-primary' : ''}`}
										onClick={() => selectTag(tag.id)}
									>
										<CardHeader className="p-4">
											<CardTitle className="text-center text-xl flex items-center justify-center gap-2">
												<span>{tag.emoji}</span>
												<span>{tag.name}</span>
												{tag.isFavorite && <span className="text-yellow-500">★</span>}
											</CardTitle>
										</CardHeader>
										<CardFooter className="p-2 flex justify-between">
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleToggleFavorite(tag);
												}}
											>
												{tag.isFavorite ? '★' : '☆'}
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteTag(tag.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</CardFooter>
									</Card>
								))
							)}
						</div>
					</TabsContent>

					<TabsContent value="create" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="tag-name">Nombre</Label>
								<Input
									id="tag-name"
									value={newTagName}
									onChange={(e) => setNewTagName(e.target.value)}
									placeholder="Nombre de la etiqueta"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="tag-emoji">Emoji</Label>
								<Input
									id="tag-emoji"
									value={newTagEmoji}
									onChange={(e) => setNewTagEmoji(e.target.value)}
									placeholder="Emoji de la etiqueta"
								/>
							</div>

							<Button
								onClick={handleCreateTag}
								disabled={isLoading || !newTagName.trim()}
								className="w-full"
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Crear Etiqueta
							</Button>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}